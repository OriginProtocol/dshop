const { fetch } = require('./api')
const { Order, Shop } = require('../../models')
const { DSHOP_CACHE } = require('../../utils/const')
const { PrintfulWebhookEvents } = require('../../utils/enums')
const sendNewOrderEmail = require('../../utils/emails/newOrder')
const encConf = require('../../utils/encryptedConfig')
const { printfulSyncQueue } = require('../../queues/queues')
const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.printful.webhook')

/**
 * Registers a webhook with Printful.
 * @param {number} shopId
 * @param {object} shopConfig
 * @param {string} backendUrl
 * @returns {Promise<string|null>} Webhook's secret
 * @throws in case of an error
 */
const registerPrintfulWebhook = async (shopId, shopConfig, backendUrl) => {
  const apiKey = shopConfig.printful

  const secret = Math.random().toString(36).substring(2)
  const webhookURL = `${backendUrl}/printful/webhooks/${shopId}/${secret}`
  const registerData = {
    url: webhookURL,
    types: Object.values(PrintfulWebhookEvents)
  }

  let error
  try {
    const resp = await fetch(apiKey, '/webhooks', 'POST', registerData)
    const respJSON = await resp.json()
    if (!resp.ok) {
      error = respJSON
    }
    log.info(`Shop ${shopId} - Registered printful webhook`, webhookURL)
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
 * @param shopId
 * @param shopConfig
 * @returns {Promise<void>}
 * @throws
 */
const deregisterPrintfulWebhook = async (shopId, shopConfig) => {
  const apiKey = shopConfig.printful

  let error
  try {
    const resp = await fetch(apiKey, '/webhooks', 'DELETE')
    const respJSON = await resp.json()
    if (!resp.ok) {
      error = respJSON
    }
    log.info('Shop ${shopId} - De-registered printful webhook')
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
 * @param shopId
 * @param shopConfig
 * @returns {Promise<void>}
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
    const resp = await fetch(apiKey, '/webhooks', 'GET')
    respJson = await resp.json()
    if (!resp.ok) {
      error = respJson
    }
  } catch (err) {
    error = err.message
  }
  if (error) {
    log.error(`Shop ${shopId} - Failed getting printful webhook: ${error}`)
    throw new Error(`Failed getting printful webhook`)
  }

  // Check the webhook URL is as expected.
  const webhookUrl = respJson.url
  const expectedWebhookUrl = `${networkConfig.backendUrl}/printful/webhooks/${shopId}/${shopConfig.printfulWebhookSecret}`

  if (webhookUrl !== expectedWebhookUrl) {
    log.error(`Shop ${shopId} - Invalid webhook secret`)
    // Try to find out with a bit more details about the mismatch.
    if (!webhookUrl.endsWith(shopConfig.printfulWebhookSecret)) {
      throw new Error(
        "Webhook URL does not use secret stored in the shop's config"
      )
    }
    throw new Error(`Invalid webhook URL ${webhookUrl}`)
  }
}

/**
 * Processes a PackageShipped event sent by Printful via webhook.
 * @param event
 * @param shopId
 * @returns {Promise<void>}
 */
const processShippedEvent = async (event, shopId) => {
  try {
    const { shipment, order } = event

    const shop = await Shop.findOne({ where: { id: shopId } })

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
 * @param event
 * @param shopId
 * @returns {Promise<void>}
 */
const processUpdatedEvent = async (event, shopId) => {
  const {
    sync_product: { id }
  } = event

  const shop = await Shop.findOne({ where: { id: shopId } })

  const OutputDir = `${DSHOP_CACHE}/${shop.authToken}`

  const apiKey = await encConf.get(shopId, 'printful')

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

module.exports = {
  registerPrintfulWebhook,
  deregisterPrintfulWebhook,
  checkPrintfulWebhook,
  processShippedEvent,
  processUpdatedEvent
}
