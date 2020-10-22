const fetch = require('node-fetch')
const get = require('lodash/get')

const { getLogger } = require('../../utils/logger')
const { getConfig } = require('../../utils/encryptedConfig')
const { testPGP } = require('../../utils/pgp')
const paypalUtils = require('../../utils/paypal')
const { loadJsonConfigFromDisk } = require('../../utils/shop')
const { getShopTransport } = require('../../utils/emails/_getTransport')
const { checkStripeConfig, checkStripePayments } = require('../payments/stripe')
const { Network, ShopDeployment } = require('../../models')
const {
  dbConfigBaseKeys,
  dbConfigOptionalKeys,
  jsonConfigBaseKeys,
  jsonConfigOptionalKeys,
  jsonConfigNetworkBaseKeys,
  jsonConfigNetworkOptionalKeys
} = require('./config')
const { ShopDeploymentStatuses } = require('../../enums')

const log = getLogger('logic.shop.health')

/**
 * Checks a config for missing mandatory keys and unexpected keys.
 *
 * @param config
 * @param baseKeys
 * @param optionalKeys
 * @returns {{missingKeys: Array<string>, unknownKeys: Array<string>}}
 */
function checkConfig(config, baseKeys, optionalKeys) {
  // Look for missing base keys.
  const missingKeys = baseKeys.filter((key) => !(key in config))
  // Look for keys not part of the base or optional set.
  const knownKeys = baseKeys.concat(optionalKeys)
  const unknownKeys = Object.keys(config).filter((key) =>
    knownKeys.includes(key)
  )
  return { missingKeys, unknownKeys }
}

/**
 * Checks the validity of a shop's json config.
 *
 * @param {number} shopId
 * @param {number} networkId
 * @param {object} jsonConfig
 * @param {string} configName
 * @returns {{success: false, errors: array<string>}|{success: true}}
 */
function checkJsonConfig(shopId, networkId, jsonConfig, configName) {
  const errors = []
  let check = checkConfig(
    jsonConfig,
    jsonConfigBaseKeys,
    jsonConfigOptionalKeys
  )
  if (check.missingKeys.length > 0) {
    log.error(
      `Shop ${shopId} - ${configName} misses some keys ${check.missingKeys}`
    )
    errors.push(`${configName} misses keys ${check.missingKeys}`)
  }
  if (check.unknownKeys.length > 0) {
    log.error(
      `Shop ${shopId} - ${configName} includes unexpected keys ${check.unknownKeys}`
    )
    errors.push(`${configName} includes unexpected keys ${check.unknownKeys}`)
  }

  const networkConfig = get(jsonConfig, `networks[${networkId}`, {})
  check = checkConfig(
    networkConfig,
    jsonConfigNetworkBaseKeys,
    jsonConfigNetworkOptionalKeys
  )
  if (check.missingKeys.length > 0) {
    log.error(
      `Shop ${shopId} - ${configName} misses networks keys ${check.missingKeys}`
    )
    errors.push(`${configName} misses networks keys ${check.missingKeys}`)
  }
  if (check.unknownKeys.length > 0) {
    log.error(
      `Shop ${shopId} - ${configName} includes unexpected networks keys ${check.unknownKeys}`
    )
    errors.push(
      `${configName} includes unexpected networks keys ${check.unknownKeys}`
    )
  }
  return errors
}

/**
 * Checks the validity of a shop's offline payment config (subsection of json config).
 *
 * @param {object} config
 * @param {string} configName
 * @returns {{success: false, errors: array<string>}|{success: true}}
 */
function checkOfflinePaymentConfig(config, configName) {
  const offlinePaymentBaseKeys = [
    'label',
    'details',
    'instructions',
    'id',
    'disabled'
  ]
  const offlinePaymentsOptionalKeys = ['qrImage']
  const errors = []
  for (const method of config.offlinePaymentMethods) {
    const { missingKeys, unknownKeys } = checkConfig(
      method,
      offlinePaymentBaseKeys,
      offlinePaymentsOptionalKeys
    )
    if (missingKeys.length > 0) {
      log.error(
        `Shop {shop.id} - ${configName} misses offline payment keys ${missingKeys}`
      )
      errors.push(
        `Method ${method.label}: DB config misses keys ${missingKeys}`
      )
    }
    if (unknownKeys.length > 0) {
      log.error(
        `Shop {shop.id} - ${configName} includes unexpected keys ${unknownKeys}`
      )
      errors.push(`DB config includes unexpected keys ${unknownKeys}`)
    }
  }
  return errors
}

/**
 * Runs a battery of tests on a shop to identify any potential
 * configuration or data related issues.
 *
 * @param {models.Shop} shop
 * @returns {object}
 */
async function diagnoseShop(shop) {
  const diagnostic = {}
  const network = await Network.findOne({ where: { active: true } })
  const networkConfig = getConfig(network.config)
  const shopIsPublished = await ShopDeployment.findOne({
    where: {
      shopId: shop.id,
      status: ShopDeploymentStatuses.Success
    }
  })

  //
  // Decrypt the encrypted config from the DB and check its validity.
  //
  let shopConfig = {}
  let errors = []
  try {
    shopConfig = getConfig(shop.config)
    const { missingKeys, unknownKeys } = checkConfig(
      shopConfig,
      dbConfigBaseKeys,
      dbConfigOptionalKeys
    )
    if (missingKeys.length > 0) {
      log.error(
        `Shop {shop.id} - json config on disk misses some keys ${missingKeys}`
      )
      errors.push(`Json config on disk misses keys ${missingKeys}`)
    }
    if (unknownKeys.length > 0) {
      log.error(
        `Shop {shop.id} - json config on disk includes unexpected keys ${unknownKeys}`
      )
      errors.push(`Json config on disk includes unexpected keys ${unknownKeys}`)
    }
  } catch (e) {
    log.error(`Shop {shop.id} - Failed loading shop config: ${e}`)
    diagnostic.dbConfig = {
      status: 'ERROR',
      error: "Failed loading shop's config"
    }
  }

  //
  // Load config.json from disk and check its validity.
  //
  errors = []
  let shopJsonConfigOnDisk = {}
  try {
    shopJsonConfigOnDisk = loadJsonConfigFromDisk(shop)
    errors = checkJsonConfig(
      shop.id,
      network.networkId,
      shopJsonConfigOnDisk,
      'Json config on disk'
    )
  } catch (e) {
    log.error(`Shop {shop.id} - Failed loading json config from disk: ${e}`)
    errors.push(`Failed loading json config from disk`)
  }
  if (errors.length > 0) {
    diagnostic.jsonConfigOnDisk = { status: 'ERROR', errors }
  } else {
    diagnostic.jsonConfigOnDisk = { status: 'OK' }
  }

  //
  // If the shop is published, load config.json from the web and check its validity.
  //
  errors = []
  let shopJsonConfigOnWeb = {}
  if (shopIsPublished) {
    try {
      const url = `shopConfig.dataUrl/config.json`
      const res = await fetch(url)
      shopJsonConfigOnWeb = await res.json()
      errors = checkJsonConfig(
        shop.id,
        network.networkId,
        shopJsonConfigOnWeb,
        'Json config on web'
      )
    } catch (e) {
      log.error(`Shop {shop.id} - Failed loading json config on web: ${e}`)
      errors.push(`Failed loading json config from web`)
    }
  }
  if (errors.length > 0) {
    diagnostic.jsonConfigOnWeb = { status: 'ERROR', errors }
  } else {
    diagnostic.jsonConfigOnWeb = { status: shopIsPublished ? 'OK' : 'N/A' }
  }

  // Check PGP key.
  try {
    const { pgpPrivateKeyPass, pgpPublicKey, pgpPrivateKey } = shopConfig
    testPGP({ pgpPrivateKeyPass, pgpPublicKey, pgpPrivateKey })
    diagnostic.pgp = { status: 'OK' }
  } catch (e) {
    log.error(`Shop {shop.id} - Invalid PGP key: ${e}`)
    diagnostic.pgp = { status: 'ERROR', errors: ['Invalid PGP key'] }
  }

  // Check Stripe configuration.
  const stripeCheck = checkStripeConfig(network, shop)
  if (stripeCheck.success) {
    diagnostic.stripe = { status: 'OK' }
  } else {
    diagnostic.stripe = { status: 'ERROR', errors: [stripeCheck.error] }
  }

  // Check PayPal configuration.
  const client = paypalUtils.getClient(
    networkConfig.paypalEnvironment,
    shopConfig.paypalClientId,
    shopConfig.paypalClientSecret
  )
  const valid = await paypalUtils.validateCredentials(client)
  if (valid) {
    diagnostic.paypal = { status: 'OK' }
  } else {
    diagnostic.paypal = { status: 'ERROR', errors: ['Invalid credentials'] }
  }
  // TODO: check PayPal webhook.

  // Check offline payment configuration.
  // It is stored both in the DB and in config.json
  errors = []
  if (shopConfig.offlinePaymentMethods) {
    errors = checkOfflinePaymentConfig(
      shopConfig.offlinePaymentMethods,
      'DB config'
    )
  }
  if (shopIsPublished) {
    errors.concat(checkOfflinePaymentConfig(shopJsonConfigOnWeb, 'Web config'))
  }
  if (errors.length > 0) {
    diagnostic.offlinePayment = { status: 'ERROR', errors }
  } else {
    diagnostic.offlinePayment = { status: 'OK' }
  }

  // Check Printful configuration.
  if (shopConfig.printful) {
    if (!shopConfig.printfulWebhookSecret) {
      diagnostic.printful = {
        status: 'ERROR',
        errors: ['Webhook not configured']
      }
    } else {
      diagnostic.printful = { status: 'OK' }
    }
  } else {
    diagnostic.printful = { status: 'Not configured' }
  }
  // TODO: check printful credentials and webhook.

  // Check Email configuration.
  if (shopConfig.email) {
    try {
      getShopTransport(shop, network)
      diagnostic.email = { status: 'OK' }
    } catch (e) {
      log.error(`Shop {shop.id} - Invalid email configuration: ${e}`)
      diagnostic.email = {
        status: 'ERROR',
        errors: ['Email provider incorrectly configured']
      }
    }
  }

  // Check Orders
  const checkStripeOrders = checkStripePayments(shop.id, shopConfig)
  if (checkStripeOrders.success) {
    diagnostic.stripePayments = { status: 'OK' }
  } else {
    diagnostic.stripePayments = {
      status: 'ERROR',
      errors: checkStripeOrders.errors
    }
  }
  // TODO: check orders made with other types of payment.

  return diagnostic
}

module.exports = {
  diagnoseShop
}
