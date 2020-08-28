// A utility script for backfilling data for the direct crypto launch.

const fs = require('fs')
const ethers = require('ethers')

const { Event, Shop } = require('../../models')
const { getConfig, setConfig } = require('../../utils/encryptedConfig')
const { DSHOP_CACHE } = require('../../utils/const')
const { ListingID } = require('../../id')
const { getLogger } = require('../../utils/logger')
const log = getLogger('cli')

const program = require('commander')

program
  .requiredOption(
    '-o, --operation <operation>',
    'Action to perform: [setWallet|updateConfigJson|]'
  )
  .requiredOption('-n, --networkId <id>', 'Network id: [1,4,999]')
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-n, --shopName <name>', 'Shop Name')
  .option('-a, --allShops', 'Apply the operation to all shops')
  .option('-d, --doIt <boolean>', 'Write the data to DB/disk.')

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

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

async function _getShopWalletAddress(shop) {
  if (shop.listingId) {
    // Most recent shops have this field set but legacy ones don't.
    if (shop.walletAddress) {
      return shop.walletAddress
    }

    // Query the events table to find out the address that created the listing.
    const lid = ListingID.fromFQLID(shop.listingId)
    const event = await Event.findOne({
      where: {
        eventName: 'ListingCreated',
        listingId: lid.listingId
      }
    })
    if (event) {
      return event.party
    }
  }

  // As a last resort, check if the shop has a web3 PK and use that to
  // derive the walletAddress to use...
  const shopConfig = getConfig(shop.config)
  if (shopConfig.web3Pk) {
    const wallet = new ethers.Wallet(shopConfig.web3Pk)
    return wallet.address
  }

  log.info(`Shop ${shop.id}: could not determine a walletAddress`)
  return null
}

// Set the 'walletAddress' field in all the shops DB config.
async function setWallet(config, shops) {
  for (const shop of shops) {
    const walletAddress = await _getShopWalletAddress(shop)
    if (!walletAddress) {
      log.info(`Shop ${shop.id}: no wallet address. Skipping`)
      continue
    }
    if (config.doIt) {
      log.info(
        `Shop ${shop.id}: Setting walletAddress to ${walletAddress} in the config...`
      )
      const shopConfig = getConfig(shop.config)
      shopConfig['walletAddress'] = walletAddress
      shop.config = setConfig(shopConfig, shop.config)
      await shop.save()
    } else {
      log.info(
        `Shop ${shop.id}: Would set walletAddress to ${walletAddress} in the config...`
      )
    }
  }
}

// Update all the shop's config.json in the staging area
// to set a "networks[<networkId]['walletAddress'] value.
async function updateConfigJson(config, shops) {
  const networkId = config.networkId

  for (const shop of shops) {
    const walletAddress = await _getShopWalletAddress(shop)
    if (!walletAddress) {
      log.info(`Shop ${shop.id}: no wallet address. Skipping`)
      continue
    }

    const configFile = `${DSHOP_CACHE}/${shop.authToken}/data/config.json`
    if (!fs.existsSync(configFile)) {
      log.error(`Shop ${shop.id}: file ${configFile} not found`)
      continue
    }

    try {
      let configStr = fs.readFileSync(configFile).toString()
      const config = JSON.parse(configStr)
      config['networks'][networkId]['walletAddress'] = walletAddress
      configStr = JSON.stringify(config, null, 2)

      if (config.doIt) {
        log.info(
          `Shop ${shop.id}: updating ${configFile} to set networks[${networkId}].walletAddress to ${walletAddress}`
        )
        fs.writeFileSync(configFile, configStr)
      } else {
        log.info(
          `Shop ${shop.id}: would update ${configFile} to set networks[${networkId}].walletAddress to ${walletAddress}`
        )
      }
    } catch (e) {
      log.error(`Shop ${shop.id}: Failure updating ${configFile}`, e)
    }
  }
}

async function main(config) {
  const shops = await _getShops(config)

  if (config.operation === 'setWallet') {
    await setWallet(config, shops)
  } else if (config.operation === 'updateConfigJson') {
    await updateConfigJson(config, shops)
  } else {
    throw new Error(`Unsupported operation ${config.operation}`)
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
