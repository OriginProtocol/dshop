// A utility script for updating the IPFS API and Gateway URLs
// in the shops config.json files on disk.

const fs = require('fs')
const ethers = require('ethers')

const { Shop } = require('../../models')
const { DSHOP_CACHE } = require('../../utils/const')
const { getLogger } = require('../../utils/logger')
const log = getLogger('cli')

const program = require('commander')

program
  .requiredOption('-n, --networkId <id>', 'Network id: [1,4,999]')
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-n, --shopName <name>', 'Shop Name')
  .option('-a, --allShops', 'Apply the operation to all shops')
  .option('-d, --doIt <boolean>', 'Write the data to DB/disk.')

if (!process.argv.slice(1).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)


const newIpfsGateway = 'https://fs-autossl.ogn.app'
const newIpfsApi = 'https://fs.ogn.app'

async function _getShops() {
  let shops
  if (program.shopId) {
    const shop = await Shop.findOne({ where: { id: program.shopId } })
    if (!shop) {
      throw new Error(`No shop with id ${program.shopId}`)
    }
    log.info(`Loaded shop ${shop.name} (${shop.id})`)
    shops = [shop]
  } else if (program.shopName) {
    const shop = await Shop.findOne({ where: { name: program.shopName } })
    if (!shop) {
      throw new Error(`No shop with name ${program.shopName}`)
    }
    log.info(`Loaded shop ${shop.name} (${shop.id})`)
    shops = [shop]
  } else if (program.allShops) {
    shops = await Shop.findAll({ order: [['id', 'asc']] })
    log.info(`Loaded ${shops.length} shops`)
  } else {
    throw new Error('Must specify shopId or shopName')
  }
  return shops
}


async function updateIpfsUrls(shops) {
  const networkId = program.networkId

  for (const shop of shops) {
    log.info(`Processing Shop ${shop.id} DataDir ${shop.authToken}`)

    // Read the IPFS URLs from config.json
    const configFile = `${DSHOP_CACHE}/${shop.authToken}/data/config.json`
    if (!fs.existsSync(configFile)) {
      log.error(`Shop ${shop.id}: file ${configFile} not found`)
      continue
    }
    const raw = fs.readFileSync(configFile).toString()
    const jsonConfig = JSON.parse(raw)
    const ipfsApi = jsonConfig['networks'][networkId]['ipfsApi']
    const ipfsGateway = jsonConfig['networks'][networkId]['ipfsGateway']

    if (!ipfsApi) {
      log.error(`Shop ${shop.id} - No ipfsApi`)
    }
    if (!ipfsGateway) {
      log.error(`Shop ${shop.id} - No ipfsGateway`)
    }


    if (program.doIt) {
      // TODO
      log.info('Done.')
    } else {
      log.info(`Shop ${shop.id} ${shop.name} - Would set ipfsApi to ${newIpfsApi}`)
      log.info(`Shop ${shop.id} ${shop.name} - Would set ipfsGateway to ${newIpfsGateway}`)
    }
  }
}

async function main() {
  const shops = await _getShops()
  await updateIpfsUrls(shops)
}

//
// MAIN
//

main()
  .then(() => {
    log.info('Finished')
    process.exit()
  })
  .catch((err) => {
    log.error('Failure: ', err)
    log.error('Exiting')
    process.exit(-1)
  })