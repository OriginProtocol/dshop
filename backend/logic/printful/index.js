const fs = require('fs')
const { get, pick } = require('lodash')

const generatePrintfulOrder = require('@origin/utils/generatePrintfulOrder')

const { fetch } = require('./api')
const { DSHOP_CACHE } = require('../../utils/const')
const sendPrintfulOrderFailedEmail = require('../../utils/emails/printfulOrderFailed')
const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.printful.order')

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

  const result = await fetch({
    apiKey,
    path: `/orders/@${orderId}`,
    method: 'GET'
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

/**
 * Places a Printful order.
 * @param apiKey
 * @param orderData
 * @param opts
 * @returns {Promise<{success: boolean, message: *, status: *}|{success: boolean, message: string, status: number}|{success: boolean}>}
 */
const placeOrder = async (apiKey, orderData, opts = {}) => {
  if (!apiKey) {
    return {
      status: 500,
      success: false,
      message: 'Missing printful API configuration'
    }
  }

  const path = `/orders${opts.draft ? '' : '?confirm=true'}`
  const newOrderResponse = await fetch({
    apiKey,
    path,
    method: 'POST',
    body: orderData
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
    return { success: false, message: 'Error parsing Printful API response' }
  }
}

/**
 * Confirms a Printful order.
 * @param apiKey
 * @param orderId
 * @returns {Promise<{success: boolean, message: string, status: number}|{success: boolean}>}
 */
const confirmOrder = async (apiKey, orderId) => {
  if (!apiKey) {
    return {
      status: 500,
      success: false,
      message: 'Missing printful API configuration'
    }
  }

  const confirmOrderResponse = await fetch({
    apiKey,
    path: `/orders/@${orderId}/confirm`,
    method: 'POST'
  })
  const json = await confirmOrderResponse.json()
  log.debug(json)

  return { success: true }
}

/**
 * Fetches shipping estimate from Printful
 * @param apiKey
 * @param data
 * @returns {Promise<*|{success: boolean, message: string, status: number}|{success: boolean}>}
 */
const fetchShippingEstimate = async (apiKey, data) => {
  if (!apiKey) {
    return {
      status: 500,
      success: false,
      message: 'Service Unavailable'
    }
  }

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

  const shippingRatesResponse = await fetch({
    apiKey,
    path: `/shipping/rates`,
    method: 'POST',
    body: query
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

/**
 * Fetches tax rates from Printful.
 * @param apiKey
 * @param data
 * @returns {Promise<{success: boolean, message: string, status: number}|{success: boolean}>}
 */
const fetchTaxRates = async (apiKey, data) => {
  if (!apiKey) {
    return {
      status: 500,
      success: false,
      message: 'Service Unavailable'
    }
  }

  const { recipient } = data
  const query = {
    recipient: {
      city: recipient.city,
      country_code: recipient.countryCode,
      state_code: recipient.provinceCode,
      zip: recipient.zip
    }
  }

  const shippingRatesResponse = await fetch({
    apiKey,
    path: `/tax/rates`,
    method: 'POST',
    body: query
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
 * @param {models.Order} orderObj
 * @param {object} shopConfig
 * @param {models.Shop} shop
 * @returns {Promise<void>}
 */
const autoFulfillOrder = async (orderObj, shopConfig, shop) => {
  const shopId = shop.id

  const handleError = async (error) => {
    log.error(`Shop ${shopId} - Failed to auto-fulfill order`, error)

    try {
      // Notify the merchant of the fulfillment failure by email.
      const message = error.message
      await sendPrintfulOrderFailedEmail(shop.id, orderObj, { message })

      // Store the fulfillment error in the order's metadata.
      const errorData = {
        // Add a new fullfillError field.
        fulfillError: message,
        // Add to the possibly already existing error field which stores the list of errors.
        error: [...get(orderObj, 'data.error', []), message]
      }
      const data = { ...orderObj.data, ...errorData }
      await orderObj.update({ data })
    } catch (err) {
      log.error('autoFulfillOrder error handler failure', err)
    }
  }

  try {
    log.info(
      `Shop ${shopId} - Trying to auto fulfill order ${orderObj.id} on printful...`
    )

    const apiKey = shopConfig.printful
    if (!apiKey) {
      return handleError(new Error('Missing Printful API key'))
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
      return handleError(new Error(message))
    }

    log.info(`Shop ${shopId} - Order created on printful`)
  } catch (err) {
    return handleError(err)
  }
}

module.exports = {
  fetchOrder,
  placeOrder,
  confirmOrder,
  fetchShippingEstimate,
  fetchTaxRates,
  autoFulfillOrder
}
