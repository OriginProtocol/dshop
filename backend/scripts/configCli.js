// A utility script for shop configs.
//
// Note: easiest is to run the script from local after having setup
// a SQL proxy to prod and the ENCRYPTION_KEY env var.
//
// Examples:
//  - dump network and shop config
//  node configCli.js --shopName=Origin --action=dump
//  - get a shop's config value for a specific key
//  node configCli.js --networkId=1 --shopName=<shopName> --action=get --key=<key>
//  - set a shop's config value
//  node configCli.js --networkId=1 --shopName=<shopName> --action=get --key=<key> --value=<value>
//

const { Network, Shop } = require('../models')
const { getLogger } = require('../utils/logger')
const log = getLogger('cli')

const { getConfig, setConfig } = require('../utils/encryptedConfig')

const program = require('commander')

program
  .requiredOption(
    '-a, --action <action>',
    'Action to perform: [dump|get|set|del]'
  )
  .requiredOption('-n, --networkId <id>', 'Network id: [1,4,999]')
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-n, --shopName <name>', 'Shop Name')
  .option('-k, --key <name>', 'Shop config key')
  .option('-v, --value <name>', 'Shop config value')

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

/**
 * Dumps a shop config on the console.
 * @param {models.Network} network
 * @param {models.Shop} shop
 * @returns {Promise<void>}
 */
async function dump(network, shop) {
  const networkConfig = getConfig(network.config)
  log.info('Network Id:', network.networkId)
  log.info('Network Config:')
  log.info(networkConfig)

  const shopConfig = getConfig(shop.config)
  log.info('Shop Id:', shop.id)
  log.info('Shop Name:', shop.name)
  log.info('Shop Config:')
  log.info(shopConfig)
}

async function getKey(shop, key) {
  if (!key) {
    throw new Error('Argument key must be defined')
  }
  const shopConfig = getConfig(shop.config)
  log.info(`Shop config: ${key}=${shopConfig[key]}`)
}

async function setKey(shop, key, val) {
  if (!key) {
    throw new Error('Argument key must be defined')
  }
  if (!val) {
    throw new Error('Argument value must be defined')
  }
  log.info(`Setting ${key} to ${val} on the shop's config...`)
  const shopConfig = getConfig(shop.config)
  shopConfig[key] = val
  shop.config = setConfig(shopConfig, shop.config)
  await shop.save()
  log.info('Done')
}

async function delKey(shop, key) {
  if (!key) {
    throw new Error('Argument key must be defined')
  }
  log.info(`Deleting ${key} from the shop's config...`)
  const shopConfig = getConfig(shop.config)
  delete shopConfig[key]
  shop.config = setConfig(shopConfig, shop.config)
  await shop.save()
  log.info('Done')
}

async function _getNetwork(config) {
  const network = await Network.findOne({
    where: { networkId: config.networkId, active: true }
  })
  if (!network) {
    throw new Error(`No active network with id ${config.networkId}`)
  }
  return network
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
  log.info(`Loaded shop ${shop.name} (${shop.id})`)
  return shop
}

async function main(config) {
  const network = await _getNetwork(config)
  const shop = await _getShop(config)

  if (config.action === 'dump') {
    await dump(network, shop)
  } else if (config.action === 'get') {
    await getKey(shop, config.key)
  } else if (config.action === 'set') {
    await setKey(shop, config.key, config.value)
  } else if (config.action === 'del') {
    await delKey(shop, config.key, config.value)
  } else {
    throw new Error(`Unsupported action ${config.action}`)
  }
}

//
// MAIN
//

main(program)
  .then(() => {
    log.info('Finished')
    process.exit()
  })
  .catch((err) => {
    log.error('Failure: ', err)
    log.error('Exiting')
    process.exit(-1)
  })
