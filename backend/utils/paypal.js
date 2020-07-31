const PayPal = require('@paypal/checkout-server-sdk')
const { IS_PROD } = require('./const')

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

module.exports = {
  getClient,
  validateCredentials
}
