const fetch = require('node-fetch')
const get = require('lodash/get')

const { getLogger } = require('../../utils/logger')
const { getConfig } = require('../../utils/encryptedConfig')
const { testPGP } = require('../../utils/pgp')
const { loadJsonConfigFromDisk } = require('../../utils/shop')
const { checkStripeConfig } = require('../logic/payments/stripe')
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
 * @param config
 * @param baseKeys
 * @param optionalKeys
 * @returns {{missingKeys: Array<string>, unknownKeys: Array<string>}}
 */
function checkConfig(config, baseKeys, optionalKeys) {
  const missingKeys = baseKeys.filter((key) => !(key in config))
  const unknownKeys = Object.keys(config).filter((key) =>
    optionalKeys.includes(key)
  )
  return { missingKeys, unknownKeys }
}

function checkJsonConfig(shopId, networkId, jsonConfig, configName) {
  const errors = []
  const { missingKeys, unknownKeys } = checkConfig(
    jsonConfig,
    jsonConfigBaseKeys,
    jsonConfigOptionalKeys
  )
  if (missingKeys.length > 0) {
    log.error(`Shop ${shopId} - ${configName} misses some keys ${missingKeys}`)
    errors.push(`${configName} misses keys ${missingKeys}`)
  }
  if (unknownKeys.length > 0) {
    log.error(
      `Shop ${shopId} - ${configName} includes unexpected keys ${unknownKeys}`
    )
    errors.push(`${configName} includes unexpected keys ${unknownKeys}`)
  }
  const networkConfig = get(jsonConfig, `networks[${networkId}`, {})
  const { missingNetworkKeys, unallowedNetworkKeys } = checkConfig(
    networkConfig,
    jsonConfigNetworkBaseKeys,
    jsonConfigNetworkOptionalKeys
  )
  if (missingNetworkKeys.length > 0) {
    log.error(
      `Shop ${shopId} - ${configName} misses networks keys ${missingKeys}`
    )
    errors.push(`${configName} misses networks keys ${missingKeys}`)
  }
  if (unallowedNetworkKeys.length > 0) {
    log.error(
      `Shop ${shopId} - ${configName} includes unexpected networks keys ${unknownKeys}`
    )
    errors.push(
      `${configName} includes unexpected networks keys ${unknownKeys}`
    )
  }
  return errors
}

async function diagnoseShop(shop) {
  const diagnostic = {}
  const network = await Network.findOne({ where: { active: true } })

  //
  // Decrypt the encrypted config from the DB and check its validity.
  //
  let shopConfig
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
  try {
    const shopJsonConfigOnDisk = loadJsonConfigFromDisk(shop)
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
  // If the shop is published, Load config.json from the web and check its validity.
  //
  errors = []
  const shopIsPublished = await ShopDeployment.findOne({
    where: {
      shopId: shop.id,
      status: ShopDeploymentStatuses.Success
    }
  })
  if (shopIsPublished) {
    try {
      const url = `shopConfig.dataUrl/config.json`
      const res = await fetch(url)
      const shopJsonConfigOnWeb = await res.json()
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
    diagnostic.pgp = { status: 'ERROR', error: 'Invalid PGP key' }
  }

  // Check Stripe configuration.
  const stripeCheck = checkStripeConfig(network, shop)
  if (stripeCheck.success) {
    diagnostic.stripe = { status: 'OK' }
  } else {
    diagnostic.stripe = { status: 'ERROR', error: stripeCheck.error }
  }

  // Check PayPal configuration.
  // TODO

  // Check Printful configuration.
  // TODO

  // Check Email configuration.

  // Check Orders
}

module.exports = {
  diagnoseShop
}
