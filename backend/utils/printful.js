const get = require('lodash/get')
const fetch = require('node-fetch')
const fs = require('fs')

const { getLogger } = require('./logger')

const log = getLogger('utils.printful')

const { DSHOP_CACHE } = require('./const')

const generatePrintfulOrder = require('@origin/utils/generatePrintfulOrder')

const { sendPrintfulOrderFailedEmail, sendNewOrderEmail } = require('./emailer')

const { Order } = require('../models')

const PrintfulURL = 'https://api.printful.com'

const fetchOrder = async (apiKey, orderId) => {
  if (!apiKey) {
    return {
      status: 500,
      message: 'Missing printful API configuration'
    }
  }

  const apiAuth = Buffer.from(apiKey).toString('base64')

  const result = await fetch(`${PrintfulURL}/orders/@${orderId}`, {
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${apiAuth}`
    }
  })
  const json = await result.json()
  return {
    success: true,
    ...get(json, 'result', {})
  }
}

const placeOrder = async (apiKey, orderData, opts = {}) => {
  if (!apiKey) {
    return {
      status: 500,
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
        amount: Number(rate.rate) * 100,
        countries: [recipient.countryCode]
      }
    })
    return shipping
  } else {
    return { success: false }
  }
}

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

  try {
    log.info('Trying to auto fulfill order on printful...')

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
      log.error('Failed to auto-fulfill order', message)
      await sendFailureEmail(message)
    } else {
      log.info('Order created on printful')
    }
  } catch (err) {
    log.error('Failed to auto-fulfill order', err)
    await sendFailureEmail()
  }
}

const registerPrintfulWebhook = async (shopConfig) => {
  try {
    const webhookHost = get(shopConfig, `publicUrl`)

    const apiKey = shopConfig.printful
    if (!apiKey) {
      return
    }

    const apiAuth = Buffer.from(apiKey).toString('base64')

    const url = `${PrintfulURL}/webhooks`

    const webhookURL = `${webhookHost}/printful-webhook`

    const registerData = {
      url: webhookURL,
      types: ['package_shipped']
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
      log.info(`Registered printful webhook`, webhookURL, respJSON)
    } else {
      log.error('Failed to register printful webhook', respJSON)
    }
  } catch (err) {
    log.error('Failed to register printful webhook', err)
  }
}

const deregisterPrintfulWebhook = async (shopConfig) => {
  try {
    const apiKey = shopConfig.printful
    if (!apiKey) {
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

    log.info(`Deregistered printful webhook`)
  } catch (err) {
    log.error('Failed to deregister printful webhook', err)
  }
}

const processShippedEvent = async (event) => {
  try {
    const { shipment, order } = event

    const dbOrder = await Order.findOne({
      where: {
        orderId: order.external_id
      }
    })

    if (!dbOrder) {
      log.error('Invalid order, not found in DB', order)
      return
    }

    await sendNewOrderEmail(dbOrder.shopId, dbOrder.data, {
      trackingInfo: {
        trackingNumber: shipment.tracking_number,
        trackingUrl: shipment.tracking_url,
        trackingService: shipment.service
      },
      skipVendorMail: true
    })
  } catch (err) {
    log.error('Failed to process shipped event', err)
  }
}

module.exports = {
  fetchOrder,
  placeOrder,
  confirmOrder,
  fetchShippingEstimate,
  autoFulfillOrder,
  registerPrintfulWebhook,
  deregisterPrintfulWebhook,
  processShippedEvent
}
