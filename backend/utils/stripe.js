const { normalizeDescriptor } = require('@origin/utils/stripe')
const Stripe = require('stripe')
const get = require('lodash/get')
const { getLogger } = require('./logger')
const { ExternalPayment } = require('../models')

const log = getLogger('utils.stripe')

const { IS_TEST } = require('../utils/const')
const { getConfig } = require('./encryptedConfig')

/**
 * Forms and returns the webhook object to be used to create
 * or update a webhook on Stripe
 *
 * @param {Model.Shop} shop
 * @param {String} webhookURL
 */
const getWebhookData = (shop, webhookURL) => {
  return {
    url: webhookURL,
    enabled_events: ['payment_intent.succeeded'],
    description: 'Origin Dshop payment processor',
    metadata: {
      dshopStore: shop.authToken
    }
  }
}

/**
 * Checks if remote `webhook` is configured correctly.
 *
 * @param {Stripe.WebhookEndpoint} webhook stripe's webhook endpoint object
 * @param {Model.Shop} shop
 * @param {String} webhookURL
 *
 * @returns {Boolean} false if `webhook` requires updation
 */
const validateWebhookData = (webhook, shop, webhookURL) => {
  const webhookData = getWebhookData(shop, webhookURL)

  const requiresChange = Object.keys(webhookData).some((key) => {
    switch (key) {
      case 'enabled_events':
        const hasAllPermissions = get(
          webhook,
          'enabled_events',
          []
        ).every((t) => webhookData.enabled_events.includes(t))

        return !hasAllPermissions

      case 'metadata':
        return (
          get(webhook, 'metadata.dshopStore') !==
          webhookData.metadata.dshopStore
        )
    }

    return webhook[key] !== webhookData[key]
  })

  log.debug(
    webhook,
    webhookData,
    webhook.metadata,
    shop.get({ plain: true }),
    requiresChange
  )

  return !requiresChange
}

/**
 * Deregisters any registered webhook on `shop`
 *
 * @param {Model.Shop} shop
 * @param {Model.Shop.config} config decrypted shop config
 */
async function deregisterWebhooks(shop, config) {
  const { stripeBackend, stripeWebhookSecret } = config

  if (!stripeBackend || !stripeWebhookSecret) {
    log.debug(`[Shop ${shop.id}] Missing params, skipping deregistering`)
    return
  }

  try {
    log.debug(`[Shop ${shop.id}] Trying to deregister any existing webhook...`)
    const stripe = Stripe(stripeBackend)

    const webhookEndpoints = await stripe.webhookEndpoints.list({
      limit: 100
    })

    const endpointsToDelete = webhookEndpoints.data
      .filter(
        (endpoint) => get(endpoint, 'metadata.dshopStore') === shop.authToken
      )
      .map((endpoint) => endpoint.id)

    for (const endpointId of endpointsToDelete) {
      try {
        await stripe.webhookEndpoints.del(endpointId)
      } catch (err) {
        log.error(
          `[Shop ${shop.id}] Failed to deregister webhook`,
          endpointId,
          err
        )
      }
    }

    log.debug(`${endpointsToDelete.length} webhooks deregisterd`)
  } catch (err) {
    log.error(`[Shop ${shop.id}] Failed to deregister webhooks`, err)
    return { success: false }
  }

  return { success: true }
}

/**
 * Registers new or updates existing webhook for a shop
 *
 * @param {Model.Shop} shop
 * @param {Object} newConfig New stripe credentials
 * @param {Object} oldConfig Uses `stripeWebhookSecret` from existing config to check and update webhook, if it already exists
 * @param {String} backendUrl webhook host to use
 */
async function registerWebhooks(shop, newConfig, oldConfig, backendUrl) {
  const { stripeWebhookSecret } = oldConfig
  const { stripeBackend } = newConfig

  if (!backendUrl) {
    log.error(shop.id, 'Invalid webhook host')
    return { success: false }
  }

  const webhookURL = `${backendUrl}/webhook`

  log.debug(shop.id, 'Trying to register webhook on host', backendUrl)

  try {
    const stripe = Stripe(stripeBackend)

    let existingWebhook

    if (stripeWebhookSecret) {
      const webhookEndpoints = await stripe.webhookEndpoints.list({
        limit: 100
      })

      existingWebhook = webhookEndpoints.data.find(
        (endpoint) => get(endpoint, 'metadata.dshopStore') === shop.authToken
      )
    }

    const webhookData = getWebhookData(shop, webhookURL)

    if (!existingWebhook) {
      log.debug(
        `[Shop ${shop.id}]`,
        `Webhook doesn't exist, registering a new one`
      )
      const endpoint = await stripe.webhookEndpoints.create(webhookData)

      log.debug(`[Shop ${shop.id}]`, `New webhook id`, endpoint.id)

      return { success: true, secret: endpoint.secret }
    } else {
      log.debug(
        shop.id,
        'Webhook exists, checking and updating data',
        existingWebhook.id
      )
      const valid = validateWebhookData(existingWebhook, shop, webhookURL)

      if (!valid) {
        log.debug(`[Shop ${shop.id}]`, 'Updating webhook', existingWebhook.id)
        await stripe.webhookEndpoints.update(existingWebhook.id, webhookData)
      }

      return {
        success: true,
        secret: stripeWebhookSecret
      }
    }
  } catch (err) {
    log.error(`[Shop ${shop.id}]`, 'Failed to register webhooks', err)
    return { success: false }
  }
}

/**
 * Validates shop's webhook, if it exists
 * @param {Model.Shop} shop
 * @param {Model.Shop.config} config encrypted shop config
 * @param {String} backendUrl webhook host to use
 *
 * @returns {Boolean} true, if webhook exists and is configured correctly
 */
async function webhookValidation(shop, config, backendUrl) {
  const { stripeBackend } = config
  const webhookUrl = `${backendUrl}/webhook`

  if (!stripeBackend) return false

  let valid = false

  try {
    const stripe = Stripe(stripeBackend)
    const webhookEndpoints = await stripe.webhookEndpoints.list({
      limit: 100
    })

    const existingWebhook = webhookEndpoints.data.find(
      (endpoint) => get(endpoint, 'metadata.dshopStore') === shop.authToken
    )

    if (!existingWebhook) {
      return valid
    }

    valid = validateWebhookData(existingWebhook, shop, webhookUrl)

    return valid
  } catch (err) {
    log.error(`[Shop ${shop.id}] Failed to do Stripe webhook validation`)
    log.debug(err)
  }

  return valid
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
    log.error(
      `[Shop ${shop.id}] Stripe refund for payment intent ${paymentIntent} failed: ${refundError}`
    )
    return refundError
  }

  log.info('Payment refunded')
  return null
}

module.exports = {
  getWebhookData,
  normalizeDescriptor,
  deregisterWebhooks,
  registerWebhooks,
  webhookValidation,
  processStripeRefund
}
