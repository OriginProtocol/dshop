const PayPal = require('@paypal/checkout-server-sdk')
const { IS_PROD } = require('./const')
const { getLogger } = require('./logger')
const { getConfig } = require('./encryptedConfig')
const { Network } = require('../models')

const log = getLogger('utils.paypal')

class WebhookCreateRequest {
  constructor(url, eventTypes) {
    this.path = '/v1/notifications/webhooks'
    this.verb = 'POST'
    this.body = {
      url,
      event_types: eventTypes || [{ name: '*' }]
    }
    this.headers = {
      'Content-Type': 'application/json'
    }
  }
}

class WebhookDeleteRequest {
  constructor(webhookId) {
    this.path = `/v1/notifications/webhooks/${webhookId}`
    this.verb = 'DELETE'
    this.body = null
    this.headers = {
      'Content-Type': 'application/json'
    }
  }
}

class WebhookListRequest {
  constructor() {
    this.path = `/v1/notifications/webhooks`
    this.verb = 'GET'
    this.body = null
    this.headers = {
      'Content-Type': 'application/json'
    }
  }
}

class WebhookVerifySignRequest {
  constructor(headers, event, webhookId) {
    this.path = '/v1/notifications/verify-webhook-signature'
    this.verb = 'POST'
    this.body = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: event
    }
    log.debug(this.body)
    this.headers = {
      'Content-Type': 'application/json'
    }
  }
}

const getClient = (paypalEnv, clientId, clientSecret) => {
  const { SandboxEnvironment, LiveEnvironment } = PayPal.core
  const Env = paypalEnv === 'sandbox' ? SandboxEnvironment : LiveEnvironment
  const env = new Env(clientId, clientSecret)
  return new PayPal.core.PayPalHttpClient(env)
}

const getClientFromShop = async (shop) => {
  const network = await Network.findOne({
    where: { networkId: shop.networkId }
  })
  if (!network) {
    return {}
  }
  const networkConfig = getConfig(network.config)

  const shopConfig = getConfig(shop.config)
  const { paypalClientId, paypalClientSecret, paypalWebhookId } = shopConfig

  const paypalEnv = networkConfig.paypalEnvironment
  const client = getClient(paypalEnv, paypalClientId, paypalClientSecret)

  return { client, paypalWebhookId }
}

const validateCredentials = async (client) => {
  try {
    await client.fetchAccessToken()
    return true
  } catch (err) {
    log.debug('Failed to validate paypal creds', err)
    return false
  }
}

const registerWebhooks = async (shopId, shopConfig, netConfig) => {
  const { paypalClientId, paypalClientSecret, paypalWebhookHost } = shopConfig

  try {
    const paypalEnv = netConfig.paypalEnvironment
    const client = getClient(paypalEnv, paypalClientId, paypalClientSecret)

    let webhookUrl = `${netConfig.backendUrl}/paypal/webhooks/${shopId}`

    if (!IS_PROD && paypalWebhookHost) {
      webhookUrl = `${paypalWebhookHost}/paypal/webhooks/${shopId}`
    }

    log.debug(`[Shop ${shopId}] Webhook URL:`, webhookUrl)

    const request = new WebhookCreateRequest(webhookUrl)

    const response = await client.execute(request)

    log.debug(
      `[Shop ${shopId}] Registered paypal webhook`,
      response.result.id,
      webhookUrl
    )

    return {
      webhookId: response.result.id
    }
  } catch (err) {
    log.error(`[Shop ${shopId}] Failed to register webhook on PayPal`, err)
  }

  return {}
}

const deregisterWebhook = async (shopId, shopConfig, netConfig) => {
  if (!IS_PROD) {
    return deregisterAllWebhooks(shopConfig, netConfig)
  }

  const { paypalClientId, paypalClientSecret, paypalWebhookId } = shopConfig

  try {
    const paypalEnv = netConfig.paypalEnvironment
    const client = getClient(paypalEnv, paypalClientId, paypalClientSecret)

    const request = new WebhookDeleteRequest(paypalWebhookId)
    await client.execute(request)

    log.debug(
      `[Shop ${shopId}] Deregistered paypal webhook, ${paypalWebhookId}`
    )
    return true
  } catch (err) {
    log.error(
      `[Shop ${shopId}] Failed to deregister webhook on PayPal`,
      paypalWebhookId,
      err
    )
  }

  return false
}

const deregisterAllWebhooks = async (shopConfig, netConfig) => {
  const { paypalClientId, paypalClientSecret } = shopConfig

  try {
    const paypalEnv = netConfig.paypalEnvironment
    const client = getClient(paypalEnv, paypalClientId, paypalClientSecret)

    const request = new WebhookListRequest()

    const response = await client.execute(request)

    const ids = response.result.webhooks.map((w) => w.id)

    for (const wid of ids) {
      const req = new WebhookDeleteRequest(wid)
      await client.execute(req)
      log.debug('Deregistered paypal webhook', wid)
    }

    return true
  } catch (err) {
    log.error(`Failed to deregister webhooks on PayPal`, err)
  }

  return false
}

const verifySignMiddleware = async (req, res, next) => {
  try {
    const { client, paypalWebhookId } = await getClientFromShop(req.shop)
    if (!client) {
      return res.sendStatus(500)
    }

    const request = new WebhookVerifySignRequest(
      req.headers,
      req.body,
      paypalWebhookId
    )

    const response = await client.execute(request)

    const { verification_status } = response.result

    log.debug(response)

    if (verification_status !== 'SUCCESS') {
      return res.sendStatus(400)
    }
  } catch (err) {
    log.error('Failed to verify sign', err)
    return res.sendStatus(500)
  }

  next()
}

module.exports = {
  getClient,
  getClientFromShop,
  validateCredentials,
  registerWebhooks,
  deregisterWebhook,
  verifySignMiddleware
}
