const get = require('lodash/get')
const Stripe = require('stripe')

const { getLogger } = require('../../utils/logger')
const { ExternalPayment, Order } = require('../../models')
const { Sentry } = require('../../sentry')
const { OrderPaymentTypes } = require('../../enums')

const log = getLogger('utils.stripe')

const { IS_TEST } = require('../../utils/const')
const { getConfig } = require('../../utils/encryptedConfig')

/**
 * Check whether a shop is properly configured for Stripe or not.
 *
 * @param {models.Network} network
 * @param {models.Shop} shop
 * @returns {Promise<{success: false, error: string}|{success: true}>}
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
        log.info(
          'Shop {shop.id} - Webhook properly configured. Pointing to',
          webhook.url
        )
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
 * Loads the Stripe payment in the last 30 days for a shop and
 * checks there is an associated order for each of them in the DB.
 *
 * @param {models.Shop} shop
 * @returns {Promise<{success: false, errors: array<string>}|{success: true}>}
 */
async function checkStripePayments(shopId, shopConfig) {
  const stripeKey = shopConfig.stripeBackend
  if (!stripeKey) {
    log.info('No stripe key configured')
    return
  }
  const stripe = Stripe(stripeKey)

  // Load the last 100 shop's orders paid with Stripe and get their encrypted IPFS hashes.
  const orders = await Order.findAll({
    where: { shopId, paymentType: OrderPaymentTypes.Stripe },
    limit: 100,
    order: [['id', 'desc']]
  })
  const encryptedHashes = orders.map((o) => o.encryptedIpfsHash)
  log.info(`Found ${orders.length} orders`)

  // Call the stripe API to fetch events.
  // Every event should have an encrypted hash in its metadata that corresponds to an order.
  const errors = []
  let after
  do {
    await new Promise((resolve) => {
      const eventArgs = {
        limit: 100,
        type: 'payment_intent.succeeded',
        starting_after: after
      }
      log.debug(`Fetching events after ${after}`)

      stripe.events.list(eventArgs, function (err, events) {
        if (!events) {
          return { success: true }
        }
        if (!events.data) {
          log.warning('Events object with no data:', events)
          return { success: false, errors: ['Failed loading data from Stripe'] }
        }
        log.debug(
          `Found ${events.data.length} completed Stripe payments for key (may be shared with multiple dshops)`
        )
        events.data.forEach((item) => {
          const { shopId, encryptedData } = item.data.object.metadata
          if (Number(shopId) !== shopId) {
            /* Ignore */
            // Note: the same Stripe key can be shared across multiple shops
            // which explains why we may be getting events for other shops.
          } else if (encryptedHashes.indexOf(encryptedData) < 0) {
            log.error(`Event id: ${item.id}`)
            log.error(`Event metadata: ${get(item, 'data.object.metadata')}`)
            errors.push(
              `Event ${item.id} with hash ${encryptedHashes} has no associated order`
            )
          } else {
            log.info(`Found hash ${encryptedData} OK`)
          }
        })
        after = events.data.length >= 100 ? events.data[99].id : null
        resolve()
      })
    })
  } while (after)
  if (errors.length > 0) {
    return { success: false, errors }
  } else {
    return { success: true }
  }
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
  checkStripePayments,
  processStripeRefund
}
