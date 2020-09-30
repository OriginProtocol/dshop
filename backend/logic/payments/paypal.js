const PayPal = require('@paypal/checkout-server-sdk')
const get = require('lodash/get')
const { IS_TEST } = require('../../utils/const')
const { getLogger } = require('../../utils/logger')
const { ExternalPayment } = require('../../models')
const { getClientFromShop } = require('../../utils/paypal')

const { Sentry } = require('../../sentry')

const log = getLogger('logic.paypal')

/**
 * Refunds a PayPal payment.
 *
 * @param {models.Shop} shop: Shop DB object.
 * @param {models.Order} order: Order DB object.
 * @returns {Promise<null|string>} Returns null or the reason for the failure.
 * @throws {Error}
 */
async function processPayPalRefund({ shop, order }) {
  if (IS_TEST) {
    log.info('Test environment. Skipping PayPal refund logic.')
    return null
  }

  // Load the external payment data to get the payment intent.
  const externalPayment = await ExternalPayment.findOne({
    where: {
      paymentCode: order.paymentCode
    }
  })
  if (!externalPayment) {
    throw new Error(
      `Failed loading external payment with code ${order.paymentCode}`
    )
  }

  const { client } = await getClientFromShop(shop)

  if (!client) {
    throw new Error(
      'Invalid shop config, cannot create PayPal client for refund',
      shop.id
    )
  }

  const captureId = get(externalPayment, 'data.resource.id')

  const request = new PayPal.payments.CapturesRefundRequest(captureId)

  // TODO: Should add support for partial refund??
  request.requestBody()

  try {
    const response = await client.execute(request)
    log.debug(response)
  } catch (err) {
    Sentry.captureException(
      new Error(
        `[Shop ${shop.id}] Failed to process PayPal refund, externalPayment ID: ${externalPayment.id}, paymentCode: ${order.paymentCode}, captureId: ${captureId}`
      )
    )
    log.error(
      `[Shop ${shop.id}] Failed to process PayPal refund`,
      captureId,
      externalPayment.id,
      err
    )

    const errorMessage = JSON.parse(err.message).message
    return errorMessage
  }

  return null
}

module.exports = {
  processPayPalRefund
}
