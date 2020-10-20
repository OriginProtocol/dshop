const Stripe = require('stripe')
const { getLogger } = require('../../utils/logger')
const { ExternalPayment } = require('../../models')
const { Sentry } = require('../../sentry')

const log = getLogger('utils.stripe')

const { IS_TEST } = require('../../utils/const')
const { getConfig } = require('../../utils/encryptedConfig')


/**
 * Check whether a shop is properly configured for Stripe or not.
 *
 * @param {models.Network} network
 * @param {models.Shop} shop
 * @returns {Promise<{success: boolean, error: string}|{success: boolean}>}
 */
async function checkStripeConfig(network, shop) {
  const networkConfig = getConfig(network.config)
  const validWebhhokUrls = [
    `${networkConfig.backendUrl}/webhook`,
    `https://dshopapi.ogn.app/webhook` // Legacy URL. Still supported.
  ]

  log.info(`Shop {shop.id} - Checking Stripe config`)
  let success = false
  try {
    const shopConfig = getConfig(shop.config)
    if (!shopConfig.stripeBackend) {
      log.info(`Shop {shop.id} - Stripe not configured`)
      return { success: true }
    }
    const stripe = Stripe(shopConfig.stripeBackend)
    const response = await stripe.webhookEndpoints.list()
    const webhooks = response.data

    for (const webhook of webhooks) {
      if (validWebhhokUrls.includes(webhook.url)) {
        log.info('Shop {shop.id} - Webhook properly configured. Pointing to', webhook.url)
        success = true
        break
      } else {
        log.warn(
          `Shop {shop.id} - Webhook id ${webhook.id} points to non-Dshop or invalid URL ${webhook.url}`
        )
      }
    }
  } catch (e) {
    log.error(`Shop {shop.id} - Failed checking webhook config: ${e}`)
  }

  if (!success) {
    return { success: false, error: 'Stripe Webhook not properly configured' }
  }
  return { success: true }
}


/**
 * Refunds a Stripe payment.
 *
 * @param {models.Shop} shop: Shop DB object.
 * @param {models.Order} order: Order DB object.
 * @returns {Promise<null|string>} Returns null or the reason for the Stripe failure.
 * @throws {Error}
 */
async function processStripeRefund({ shop, order }) {
  if (IS_TEST) {
    log.info('Test environment. Skipping Stripe refund logic.')
    return null
  }

  // Load the external payment data to get the payment intent.
  const externalPayment = await ExternalPayment.findOne({
    where: {
      paymentCode: order.paymentCode
    },
    attributes: ['payment_code', 'payment_intent']
  })
  if (!externalPayment) {
    throw new Error(
      `Failed loading external payment with code ${order.paymentCode}`
    )
  }

  const paymentIntent = externalPayment.get({ plain: true }).payment_intent
  if (!paymentIntent) {
    throw new Error(
      `Missing payment_intent in external payment with id ${externalPayment.id}`
    )
  }
  log.info('Payment Intent', paymentIntent)

  const shopConfig = getConfig(shop.config)

  // Call Stripe to perform the refund.
  const stripe = Stripe(shopConfig.stripeBackend)
  const piRefund = await stripe.refunds.create({
    payment_intent: paymentIntent
  })

  const refundError = piRefund.reason
  if (refundError) {
    // If stripe returned an error, log it but do not throw an exception.
    // TODO: fine-grained error handling. Some reasons might be retryable.
    Sentry.captureException(
      new Error(
        `[Shop ${shop.id}] Stripe refund for payment intent ${paymentIntent} failed: ${refundError}`
      )
    )
    log.error(
      `[Shop ${shop.id}] Stripe refund for payment intent ${paymentIntent} failed: ${refundError}`
    )
    return refundError
  }

  log.info('Payment refunded')
  return null
}

module.exports = {
  checkStripeConfig,
  processStripeRefund,
}
