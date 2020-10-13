// A utility script for backfilling the column shops.wallet based
// on the walletAddress field in the shop's config.json on disk.

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

async function updateWalletAddress(shops) {
  const originWallet = '0xDF73aF150b8E446a6D39FDdc2CFA7Bf067B88936'
  const networkId = program.networkId

  for (const shop of shops) {
    log.info(`Processing Shop ${shop.id} DataDir ${shop.authToken}`)

    // Read the wallet address from config.json
    const configFile = `${DSHOP_CACHE}/${shop.authToken}/data/config.json`
    if (!fs.existsSync(configFile)) {
      log.error(`Shop ${shop.id}: file ${configFile} not found`)
      continue
    }
    const configStr = fs.readFileSync(configFile).toString()
    const jsonConfig = JSON.parse(configStr)
    let jsonConfigWalletAddress =
      jsonConfig['networks'][networkId]['walletAddress']
    if (!jsonConfigWalletAddress) {
      log.info(`Shop ${shop.id} - No wallet address`)
      continue
    }

    // Validate the address and checksum it.
    try {
      jsonConfigWalletAddress = ethers.utils.getAddress(jsonConfigWalletAddress)
    } catch (e) {
      log.error(
        `Shop ${shop.id} - Invalid address in config.json: ${jsonConfigWalletAddress}`
      )
      continue
    }

    if (jsonConfigWalletAddress === originWallet) {
      log.error(
        `Shop ${shop.id} ${shop.name} - Address in config.json is Origin's. This should get changed.`
      )
    }

    if (shop.walletAddress) {
      log.info(
        `Shop ${shop.id} ${shop.name} - walletAddress set to ${shop.walletAddress}`
      )

      if (shop.walletAddress !== jsonConfigWalletAddress) {
        log.error(
          `Shop ${shop.id} - DB and config.json mismatch: ${shop.walletAddress} vs ${jsonConfigWalletAddress}`
        )
      }
      continue
    }

    if (program.doIt) {
      log.info(
        `Shop ${shop.id} - Setting DB wallet address to ${jsonConfigWalletAddress}`
      )
      shop.walletAddress = jsonConfigWalletAddress
      await shop.save()
      log.info('Done.')
    } else {
      const acceptedTokens = jsonConfig['networks'][networkId]['acceptedTokens']
      const acceptCrypto = Boolean(acceptedTokens && acceptedTokens.length > 1)
      log.info(
        `Shop ${shop.id} ${shop.name} acceptCrypto=${acceptCrypto} - Would set DB wallet address to ${jsonConfigWalletAddress}`
      )
    }
  }
}

async function main() {
  const shops = await _getShops()
  await updateWalletAddress(shops)
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
