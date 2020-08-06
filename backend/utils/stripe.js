const { normalizeDescriptor } = require('@origin/utils/stripe')
const Stripe = require('stripe')
const get = require('lodash/get')
const { getLogger } = require('./logger')

const log = getLogger('utils.stripe')

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

  return !requiresChange
}

async function deregisterWebhooks(shop, config) {
  const { stripeBackend, stripeWebhookSecret } = config

  if (!stripeBackend || !stripeWebhookSecret) {
    log.debug(`[Shop ${shop.id}]Missing params, skipping deregistering`)
    return
  }

  try {
    log.debug('Trying to deregister any existing webhook...')
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
        log.error('Failed to deregister webhook', endpointId, err)
      }
    }

    log.debug(`${endpointsToDelete.length} webhooks deregisterd`)
  } catch (err) {
    log.error('Failed to deregister webhooks', err)
    return { success: false }
  }

  return { success: true }
}

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
      log.debug(shop.id, `Webhook doesn't exist, registering a new one`)
      const endpoint = await stripe.webhookEndpoints.create(webhookData)

      log.debug(shop.id, `New webhook id`, endpoint.id)

      return { success: true, secret: endpoint.secret }
    } else {
      log.debug(
        shop.id,
        'Webhook exists, checking and updating data',
        existingWebhook.id
      )
      const valid = validateWebhookData(existingWebhook, shop, webhookURL)

      if (!valid) {
        log.debug(shop.id, 'Updating webhook', existingWebhook.id)
        await stripe.webhookEndpoints.update(existingWebhook.id, webhookData)
      }

      return {
        success: true,
        secret: stripeWebhookSecret
      }
    }
  } catch (err) {
    log.error('Failed to register webhooks', err)
    return { success: false }
  }
}

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

module.exports = {
  normalizeDescriptor,
  deregisterWebhooks,
  registerWebhooks,
  webhookValidation
}
