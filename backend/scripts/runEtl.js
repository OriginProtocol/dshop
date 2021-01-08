const program = require('commander')

const { getLogger } = require('../utils/logger')
const { getConfig } = require('../utils/encryptedConfig')
const { EtlJobProcessor } = require('../etl/processor')
const { Network, Shop } = require('../models')

const log = getLogger('runEtl')

program
  .requiredOption('-n, --networkId <id>', 'Network id: [1,4,999]')
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-a, --allShops', 'Apply the operation to all shops')

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

async function _getNetwork(config) {
  const network = await Network.findOne({
    where: { networkId: config.networkId, active: true }
  })
  if (!network) {
    throw new Error(`No active network with id ${config.networkId}`)
  }
  return network
}

async function _getShops(config) {
  let shops
  if (config.shopId) {
    const shop = await Shop.findOne({ where: { id: config.shopId } })
    if (!shop) {
      throw new Error(`No shop with id ${config.shopId}`)
    }
    log.info(`Loaded shop ${shop.name} (${shop.id})`)
    shops = [shop]
  } else if (config.shopName) {
    const shop = await Shop.findOne({ where: { name: config.shopName } })
    if (!shop) {
      throw new Error(`No shop with name ${config.shopName}`)
    }
    log.info(`Loaded shop ${shop.name} (${shop.id})`)
    shops = [shop]
  } else if (config.allShops) {
    shops = await Shop.findAll({ order: [['id', 'asc']] })
    log.info(`Loaded ${shops.length} shops`)
  } else {
    throw new Error('Must specify shopId or shopName')
  }
  return shops
}

async function main(config) {
  const network = await _getNetwork(config)
  const netConfig = getConfig(network.config)
  const shops = await _getShops(config)
  const etl = new EtlJobProcessor()

  for (const shop of shops) {
    try {
      log.info(`Processing shop ${shop.id}`)
      await etl._decorateShop(shop, netConfig)
      const data = await etl.processShop(shop)
      console.log(JSON.stringify(data, null, 2))
    } catch (e) {
      // Log the error but continue processing other shops.
      log.error(`Shop ${shop.id}: Failed extracting ETL data: ${e}`)
    }
  }
}

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
