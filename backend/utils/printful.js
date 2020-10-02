const get = require('lodash/get')
const fetch = require('node-fetch')
const fs = require('fs')

const { getLogger } = require('./logger')

const log = getLogger('utils.printful')

const { DSHOP_CACHE } = require('./const')

const generatePrintfulOrder = require('@origin/utils/generatePrintfulOrder')

const sendPrintfulOrderFailedEmail = require('./emails/printfulOrderFailed')
const sendNewOrderEmail = require('./emails/newOrder')

const { Order, Shop } = require('../models')

const encConf = require('./encryptedConfig')

const { printfulSyncQueue } = require('../queues/queues')

const { PrintfulWebhookEvents } = require('./enums')
const { pick } = require('lodash')

const PrintfulURL = 'https://api.printful.com'

/**
 * Fetches a Printful order.
 * @param {string} apiKey: Prinful API key.
 * @param {string} orderId: dshop order id.
 *    Format: <networkId>-<contractVersion>-<listingId>-<offerId>.
 *    Example: '1-001-81-231'
 * @returns {Promise<{statusCode: number, success: boolean, message: string}|{statusCode: number, success: boolean, ...Object}>}
 */
const fetchOrder = async (apiKey, orderId) => {
  if (!apiKey) {
    return {
      statusCode: 500,
      success: false,
      message: 'Missing Printful API configuration'
    }
  }

  const apiAuth = Buffer.from(apiKey).toString('base64')

  const result = await fetch(`${PrintfulURL}/orders/@${orderId}`, {
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${apiAuth}`
    }
  })
  const json = (await result.json()) || {}
  if (!result.ok) {
    return {
      statusCode: result.status,
      success: false,
      message: json.result || 'Printful API call failed'
    }
  }
  return {
    statusCode: 200,
    success: true,
    ...get(json, 'result', {})
  }
}

const placeOrder = async (apiKey, orderData, opts = {}) => {
  if (!apiKey) {
    return {
      status: 500,
      success: false,
      message: 'Missing printful API configuration'
    }
  }
  const apiAuth = Buffer.from(apiKey).toString('base64')
  const url = `${PrintfulURL}/orders${opts.draft ? '' : '?confirm=true'}`

  const newOrderResponse = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${apiAuth}`
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(orderData)
  })

  const text = await newOrderResponse.text()
  try {
    const json = JSON.parse(text)
    log.debug(json)

    if (!newOrderResponse.ok) {
      log.error('Attempt to create Printful order failed!')
      if (json && json.error) log.error(json.error.message)
      return {
        status: json.code,
        success: false,
        message: json.error.message
      }
    }

    return { success: true }
  } catch (e) {
    log.error('Error parsing Printful response')
    log.error(text)
    return { success: false }
  }
}

const confirmOrder = async (apiKey, orderId) => {
  if (!apiKey) {
    return {
      status: 500,
      success: false,
      message: 'Missing printful API configuration'
    }
  }
  const apiAuth = Buffer.from(apiKey).toString('base64')

  const url = `${PrintfulURL}/orders/@${orderId}/confirm`
  const confirmOrderResponse = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${apiAuth}`
    },
    credentials: 'include',
    method: 'POST'
  })
  const json = await confirmOrderResponse.json()
  log.debug(json)

  return { success: true }
}

const fetchShippingEstimate = async (apiKey, data) => {
  if (!apiKey) {
    return {
      status: 500,
      success: false,
      message: 'Service Unavailable'
    }
  }
  const apiAuth = Buffer.from(apiKey).toString('base64')

  const { recipient, items } = data

  const query = {
    recipient: {
      address1: recipient.address1,
      city: recipient.city,
      country_code: recipient.countryCode,
      state_code: recipient.provinceCode,
      zip: recipient.zip
    },
    items: items
      .map((i) => ({
        quantity: i.quantity,
        variant_id: i.variant
      }))
      .filter((i) => i.variant_id)
  }

  if (!query.items.length) {
    return { success: false }
  }

  const shippingRatesResponse = await fetch(`${PrintfulURL}/shipping/rates`, {
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${apiAuth}`
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(query)
  })
  const json = await shippingRatesResponse.json()
  if (json.result && Array.isArray(json.result)) {
    const shipping = json.result.map((rate) => {
      const [, label] = rate.name.match(/^(.*) \((.*)\)/)
      const min = rate.minDeliveryDays + 1
      const max = rate.maxDeliveryDays + 2
      return {
        id: rate.id,
        label,
        detail: `${min}-${max} business days`,
        amount: Math.round(Number(rate.rate) * 100),
        countries: [recipient.countryCode]
      }
    })
    return shipping
  } else {
    return { success: false }
  }
}

const fetchTaxRates = async (apiKey, data) => {
  if (!apiKey) {
    return {
      status: 500,
      success: false,
      message: 'Service Unavailable'
    }
  }

  const apiAuth = Buffer.from(apiKey).toString('base64')

  const { recipient } = data

  const query = {
    recipient: {
      city: recipient.city,
      country_code: recipient.countryCode,
      state_code: recipient.provinceCode,
      zip: recipient.zip
    }
  }

  const shippingRatesResponse = await fetch(`${PrintfulURL}/tax/rates`, {
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${apiAuth}`
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(query)
  })
  const json = await shippingRatesResponse.json()
  if (json.result && Number.isFinite(json.result.rate)) {
    return {
      success: true,
      ...pick(json.result, ['rate', 'required'])
    }
  } else {
    return {
      success: false
    }
  }
}

/**
 * Automatically fullfills an order on Printful.
 *
 * @param {models.Order} orderObj
 * @param {object} shopConfig
 * @param {models.Shop} shop
 * @returns {Promise<void>}
 */
const autoFulfillOrder = async (orderObj, shopConfig, shop) => {
  const sendFailureEmail = async (message) => {
    try {
      const data = {
        message: message || 'An unknown error occured'
      }

      await sendPrintfulOrderFailedEmail(shop.id, orderObj, data)
    } catch (err) {
      log.error('Failed to send email', err)
    }
  }

  const shopId = shop.id
  try {
    log.info(
      `Shop ${shopId} - Trying to auto fulfill order ${orderObj.id} on printful...`
    )

    const apiKey = shopConfig.printful
    if (!apiKey) {
      return
    }

    // TODO: Should this be a configurable variable on admin?
    const draft = process.env.NODE_ENV === 'development'
    const printfulIdsFile = `${DSHOP_CACHE}/${shop.authToken}/data/printful-ids.json`
    const printfulIds = JSON.parse(fs.readFileSync(printfulIdsFile))

    const printfulOrderData = generatePrintfulOrder(
      orderObj,
      printfulIds,
      draft
    )

    const { success, message } = await placeOrder(apiKey, printfulOrderData, {
      draft
    })

    if (!success) {
      log.error(`Shop ${shopId} - Failed to auto-fulfill order`, message)
      await sendFailureEmail(message)
    } else {
      log.info(`Shop ${shopId} - Order created on printful`)
    }
  } catch (err) {
    log.error(`Shop ${shopId} - Failed to auto-fulfill order`, err)
    await sendFailureEmail()
  }
}

/**
 * Registers a webhook with Printful.
 * @param {number} shopId
 * @param {object} shopConfig
 * @param {string} backendUrl
 * @returns {Promise<string|null>} Webhook's secret
 */
const registerPrintfulWebhook = async (shopId, shopConfig, backendUrl) => {
  try {
    const apiKey = shopConfig.printful
    if (!apiKey) {
      log.error(`Shop ${shopId} - No Printful API key in config`)
      return null
    }

    const apiAuth = Buffer.from(apiKey).toString('base64')

    const url = `${PrintfulURL}/webhooks`

    const secret = Math.random().toString(36).substring(2)

    const webhookURL = `${backendUrl}/printful/webhooks/${shopId}/${secret}`

    const registerData = {
      url: webhookURL,
      types: Object.values(PrintfulWebhookEvents)
    }

    const resp = await fetch(url, {
      headers: {
        'content-type': 'application/json',
        authorization: `Basic ${apiAuth}`
      },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify(registerData)
    })

    const respJSON = await resp.json()

    if (resp.ok) {
      log.info(
        `Shop ${shopId} - Registered printful webhook`,
        webhookURL,
        respJSON
      )
    } else {
      log.error(
        `Shop ${shopId} - Failed to register printful webhook`,
        respJSON
      )
    }

    return secret
  } catch (err) {
    log.error(`Shop ${shopId} - Failed to register printful webhook`, err)
  }
}

const deregisterPrintfulWebhook = async (shopId, shopConfig) => {
  try {
    const apiKey = shopConfig.printful
    if (!apiKey) {
      log.error(`Shop ${shopId} - No Printful API key in config`)
      return
    }

    const apiAuth = Buffer.from(apiKey).toString('base64')

    const url = `${PrintfulURL}/webhooks`

    await fetch(url, {
      headers: {
        'content-type': 'application/json',
        authorization: `Basic ${apiAuth}`
      },
      credentials: 'include',
      method: 'DELETE'
    })

    log.info(`Shop ${shopId} - Deregistered printful webhook`)
  } catch (err) {
    log.error(`Shop ${shopId} - Failed to deregister printful webhook`, err)
  }
}

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
  fetchOrder,
  placeOrder,
  confirmOrder,
  fetchShippingEstimate,
  fetchTaxRates,
  autoFulfillOrder,
  registerPrintfulWebhook,
  deregisterPrintfulWebhook,
  processShippedEvent,
  processUpdatedEvent,
  PrintfulWebhookEvents
}
