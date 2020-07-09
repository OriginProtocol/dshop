// A utility script for shop configs.
//
// Example:
//  node configCli.js --shopName=Origin --action=dump
//
// Note: easiest is to run the script from local after having setup
// a SQL proxy to prod and the ENCRYPTION_KEY env var.
//
const { Shop } = require('../models')
const { getLogger } = require('../utils/logger')
const log = getLogger('cli')

const { getConfig } = require('../utils/encryptedConfig')

/**
 * Dumps a shop config on the console.
 * @param {models.Shop} shop
 * @returns {Promise<void>}
 */
async function dump(shop) {
  const shopConfig = getConfig(shop.config)
  console.log('Shop Id:', shop.id)
  console.log('Shop Name:', shop.name)
  console.log('Shop Config:')
  console.log(shopConfig)
}

async function _getShop(config) {
  let shop
  if (config.shopId) {
    shop = await Shop.findOne({ where: { id: config.shopId } })
    if (!shop) {
      throw new Error(`No shop with id ${config.shopId}`)
    }
  } else if (config.shopName) {
    shop = await Shop.findOne({ where: { name: config.shopName } })
    if (!shop) {
      throw new Error(`No shop with name ${config.shopName}`)
    }
  } else {
    throw new Error('Must specify shopId or shopName')
  }
  return shop
}

async function main(config) {
  const shop = await _getShop(config)

  if (config.action === 'dump') {
    await dump(shop)
  } else {
    throw new Error(`Unsupported action ${config.action}`)
  }
}

//
// MAIN
//
const args = {}
process.argv.forEach((arg) => {
  const t = arg.split('=')
  const argVal = t.length > 1 ? t[1] : true
  args[t[0]] = argVal
})

const config = {
  shopId: args['--shopId'],
  shopName: args['--shopName'],
  networkId: args['--networkId'],
  action: args['--action']
}
log.info('Cli config:', config)

main(config)
  .then(() => {
    log.info('Finished')
    process.exit()
  })
  .catch((err) => {
    log.error('Failure: ', err)
    log.error('Exiting')
    process.exit(-1)
  })
