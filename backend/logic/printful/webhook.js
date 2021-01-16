const { get, uniq } = require('lodash')

const { fetch } = require('./api')
const { Order } = require('../../models')
const { DSHOP_CACHE } = require('../../utils/const')
const { PrintfulWebhookEvents } = require('../../utils/enums')
const sendNewOrderEmail = require('../../utils/emails/newOrder')
const { printfulSyncQueue } = require('../../queues/queues')
const stockUpdate = require('../printful/sync/stockUpdate')
const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.printful.webhook')

/**
 * Registers a webhook with Printful.
 * @param {number} shopId
 * @param {object} shopConfig
 * @param {string} backendUrl
 * @param {Array<number>} productIds
 * @returns {Promise<string>} Webhook's secret
 * @throws in case of an error
 */
const registerPrintfulWebhook = async (
  shopId,
  shopConfig,
  backendUrl,
  productIds = []
) => {
  const apiKey = shopConfig.printful

  const secret = Math.random().toString(36).substring(2)
  const webhookURL = `${backendUrl}/printful/webhooks/${shopId}/${secret}`
  const registerData = {
    url: webhookURL,
    types: Object.values(PrintfulWebhookEvents).filter(
      (each) => each !== PrintfulWebhookEvents.StockUpdated
    )
  }

  if (productIds.length > 0) {
    registerData.params = {
      stock_updated: {
        product_ids: productIds
      }
    }
    registerData.types = [PrintfulWebhookEvents.StockUpdated]
  }

  let error
  try {
    const resp = await fetch({
      apiKey,
      path: '/webhooks',
      method: 'POST',
      body: registerData
    })
    const respJSON = await resp.json()
    if (resp.ok) {
      log.info(`Shop ${shopId} - Registered printful webhook`, webhookURL)
    } else {
      error = JSON.stringify(respJSON)
    }
  } catch (err) {
    error = err.message
  }

  if (error) {
    log.error(`Shop ${shopId} - Failed to register printful webhook: ${error}`)
    throw new Error(`Failed to register printful webhook`)
  }

  return secret
}

/**
 * Deregisters a Printful webhook.
 * @param {Number|String} shopId
 * @param {Object} shopConfig
 * @returns {Promise<void>}
 * @throws
 */
const deregisterPrintfulWebhook = async (shopId, shopConfig) => {
  if (!shopConfig.printfulWebhookSecret) {
    log.info(`[Shop ${shopId}] No webhook registered`)
    return
  }

  const apiKey = shopConfig.printful
  if (!apiKey) {
    throw new Error('Printful API key not configured.')
  }

  let error
  try {
    const resp = await fetch({
      apiKey,
      path: '/webhooks',
      method: 'DELETE'
    })
    const respJSON = await resp.json()
    if (resp.ok) {
      log.info(`Shop ${shopId} - De-registered printful webhook`)
    } else {
      error = JSON.stringify(respJSON)
    }
  } catch (err) {
    error = err.message
  }

  if (error) {
    log.error(
      `Shop ${shopId} - Failed to deregister printful webhook: ${error}`
    )
    throw new Error(`Failed to deregister printful webhook`)
  }
}

/**
 * Check a store's Printful webhook is properly configured.
 * @param {Number|String} shopId
 * @param {Object} shopConfig
 * @returns {Promise<string>} URL of the properly configured webhook
 * @throws In case of an error or if the webhook is misconfigured.
 */
const checkPrintfulWebhook = async (shopId, shopConfig, networkConfig) => {
  const apiKey = shopConfig.printful
  if (!apiKey) {
    // Shop is not printful enabled.
    return
  }

  let respJson, error
  try {
    const resp = await fetch({
      apiKey,
      path: '/webhooks',
      method: 'GET'
    })
    respJson = await resp.json()
    if (!resp.ok) {
      error = JSON.stringify(respJson)
    }
  } catch (err) {
    error = err.message
  }
  if (error) {
    log.error(`Shop ${shopId} - Failed getting printful webhook: ${error}`)
    throw new Error(`Failed getting printful webhook`)
  }

  // Check the webhook is registered and the URL is what we expect.
  log.debug('Webhook data:', respJson)
  const webhookUrl = get(respJson, 'result.url')
  if (!webhookUrl) {
    throw new Error('No webhook registered')
  }

  const expectedWebhookUrl = `${networkConfig.backendUrl}/printful/webhooks/${shopId}/${shopConfig.printfulWebhookSecret}`
  if (webhookUrl !== expectedWebhookUrl) {
    log.error(`Shop ${shopId} - Invalid webhook`)
    // Try to find out more details about the mismatch.
    if (webhookUrl.indexOf('0.0.0.0:9000') > 0) {
      throw new Error('Webhook URL points at dev URL')
    }
    if (webhookUrl.indexOf('.ogn.app') > 0) {
      throw new Error('Webhook URL points at an ogn.app subdomain')
    }
    if (!webhookUrl.startsWith(networkConfig.backendUrl)) {
      throw new Error('Webhook URL does not point at Dshop backend')
    }
    if (!webhookUrl.endsWith(shopConfig.printfulWebhookSecret)) {
      throw new Error('Invalid webhook URL secret')
    }
    throw new Error(`Invalid webhook URL ${webhookUrl}`)
  }

  return webhookUrl
}

/**
 * Processes a PackageShipped event sent by Printful via webhook.
 * @param {Object} event
 * @param {Number|String} shopId
 * @param {Object} shopData
 * @returns {Promise<void>}
 */
const processShippedEvent = async (event, shopId, shopData) => {
  try {
    const { shipment, order } = event
    const { shop } = shopData

    const orderId = order.external_id
    const dbOrder = await Order.findOne({
      where: {
        shopId,
        shortId: orderId
      }
    })
    if (!dbOrder) {
      log.error(`Shop ${shopId} - Invalid order, not found in DB`, order)
      return
    }

    await sendNewOrderEmail({
      orderId,
      order: dbOrder,
      shop,
      cart: dbOrder.data,
      varsOverride: {
        trackingInfo: {
          trackingNumber: shipment.tracking_number,
          trackingUrl: shipment.tracking_url,
          trackingService: shipment.service
        },
        skipVendorMail: true
      }
    })
  } catch (err) {
    log.error(`Shop ${shopId} - Failed to process shipped event`, err)
  }
}

/**
 * Processes a ProductUpdated event sent by Printful via webhook.
 * @param {Object} event
 * @param {Number|String} shopId
 * @param {Object} shopData
 * @returns {Promise<void>}
 */
const processUpdatedEvent = async (event, shopId, shopData) => {
  const {
    sync_product: { id }
  } = event
  const { shop, shopConfig } = shopData

  const OutputDir = `${DSHOP_CACHE}/${shop.authToken}`

  const apiKey = get(shopConfig, 'printful')

  log.debug(
    `Shop ${shopId} - Product ${id} updated. Started to sync all products...`
  )

  await printfulSyncQueue.add(
    {
      shopId,
      OutputDir,
      apiKey,
      smartFetch: true,
      forceRefetchIds: [id]
    },
    { attempts: 1 }
  )
}

/**
 * Processes a ProductStockUpdated event sent by Printful via webhook.
 * @param {Object} event
 * @param {Number|String} shopId
 * @param {Object} shopData
 */
const processStockUpdatedEvent = async (event, shopId, shopData) => {
  try {
    const { product_id } = event
    const { shop, shopConfig } = shopData
    const shopInventory = get(shopConfig, 'inventory')
    if (shopInventory) {
      const stockOutVariant = get(event, 'variant_stock.out', [])
      const stockDiscontinuedVariant = get(
        event,
        'variant_stock.discontinued',
        []
      )

      await stockUpdate(
        shop,
        product_id,
        uniq([...stockOutVariant, ...stockDiscontinuedVariant])
      )
    }
  } catch (err) {
    log.error(`Shop ${shopId} - Failed to process stock update event`, err)
  }
  return
}

module.exports = {
  registerPrintfulWebhook,
  deregisterPrintfulWebhook,
  checkPrintfulWebhook,
  processShippedEvent,
  processUpdatedEvent,
  processStockUpdatedEvent
}
