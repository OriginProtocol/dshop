const PayPal = require('@paypal/checkout-server-sdk')
const { IS_PROD } = require('./const')
const { getLogger } = require('./logger')
const { getConfig } = require('./encryptedConfig')

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

const getClient = (clientId, clientSecret) => {
  const Environment = IS_PROD
    ? PayPal.core.LiveEnvironment
    : PayPal.core.SandboxEnvironment
  const env = new Environment(clientId, clientSecret)

  return new PayPal.core.PayPalHttpClient(env)
}

const validateCredentials = async (clientId, clientSecret) => {
  const client = getClient(clientId, clientSecret)
  try {
    await client.fetchAccessToken()
    return true
  } catch (_) {
    return false
  }
}

const validateMiddleware = async (req, res, next) => {
  if (req.body.paypal) {
    const { paypalClientId, paypalClientSecret } = req.body
    const valid = await validateCredentials(paypalClientId, paypalClientSecret)

    if (!valid) {
      return res.json({
        success: false,
        reason: 'Invalid PayPal credentials'
      })
    }
  }

  next()
}

const registerWebhooks = async (shopId, shopConfig, backendUrl) => {
  const { paypalClientId, paypalClientSecret, paypalWebhookHost } = shopConfig

  try {
    const client = getClient(paypalClientId, paypalClientSecret)

    let webhookUrl = `${backendUrl}/paypal/webhooks/${shopId}`

    if (!IS_PROD && paypalWebhookHost) {
      webhookUrl = `${paypalWebhookHost}/paypal/webhooks/${shopId}`
    }

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

const deregisterWebhook = async (shopId, shopConfig) => {
  if (!IS_PROD) {
    return deregisterAllWebhooks(shopConfig)
  }

  const { paypalClientId, paypalClientSecret, paypalWebhookId } = shopConfig

  try {
    const client = getClient(paypalClientId, paypalClientSecret)

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

const deregisterAllWebhooks = async (shopConfig) => {
  const { paypalClientId, paypalClientSecret } = shopConfig

  try {
    const client = getClient(paypalClientId, paypalClientSecret)

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
    const shopConfig = getConfig(req.shop.config)
    const { paypalClientId, paypalClientSecret, paypalWebhookId } = shopConfig

    const client = getClient(paypalClientId, paypalClientSecret)

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
  validateCredentials,
  validateMiddleware,
  registerWebhooks,
  deregisterWebhook,
  verifySignMiddleware
}
