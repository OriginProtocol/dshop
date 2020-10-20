const fetch = require('node-fetch')

const { getLogger } = require('../../utils/logger')
const { getConfig } = require('../../utils/encryptedConfig')
const { testPGP } = require('../../utils/pgp')
const { loadJsonConfigFromDisk } = require('../../utils/shop')
const { checkStripeConfig } = require('../logic/payments/stripe')
const { Network } = require('../../models')


const log = getLogger('logic.shop.health')


async function diagnoseShop(shop) {
  const diagnostic = {}
  const network = await Network.findOne({ where: { active: true } })

  // Decrypt the encrypted config from the DB.
  let shopConfig
  try {
    shopConfig = getConfig(shop.config)
    diagnostic.dbConfig = { status: 'OK' }
  } catch (e) {
    log.error(`Shop {shop.id} - Failed loading shop config: ${e}`)
    diagnostic.dbConfig = { status: 'ERROR', error: 'Failed loading shop\'s config' }
  }

  // Load config.json from the cache.
  let shopJsonConfigOnDisk
  try {
    shopJsonConfigOnDisk = loadJsonConfigFromDisk(shop)
  } catch (e) {
    log.error(`Shop {shop.id} - Failed loading json config from disk: ${e}`)
    diagnostic.jsonConfig = { status: 'ERROR', error: 'Failed loading json config from disk' }
  }
  // TODO: check all the critical fields are present.

  // Load the published config.json from the network.
  let shopJsonConfigOnWeb
  try {
    const url = `shopConfig.dataUrl/config.json`
    const res = await fetch(url)
    const shopJsonConfigOnWeb = await res.json()
  } catch(e) {
    log.error(`Shop {shop.id} - Failed loading json config from web: ${e}`)
    diagnostic.jsonConfig = { status: 'ERROR', error: 'Failed loading json config from the web' }
  }
  // TODO: check all the critical fields are present.

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
  diagnoseShop,
}