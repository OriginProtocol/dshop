/*
Script to rename the key 'backendAuthToken' to 'backendShopSlug' in the config.json files on disk
Code adapted from: './updateShopsConfigJson.js', '../configCli.js'

Example usage:
- rename key for one shop
node renameShopConfigAuthToken.js --shopId=<shopId> --oldKeyName=backendAuthToken --newKeyName=backendShopSlug
- rename key for all shops
node renameShopConfigAuthToken.js --allShops --oldKeyName=backendAuthToken --newKeyName=backendShopSlug

*/

const fs = require('fs')
const { DSHOP_CACHE } = require('../../utils/const')
const program = require('commander')
const { Shop } = require('../../models')
const { getLogger } = require('../../utils/logger')

const log = getLogger('renameShopConfigKey')

program
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-n, --shopName <name>', 'Shop Name')
  .option('-a, --allShops', 'Apply the operation to all shops')
  .requiredOption('--oldKeyName <name>', 'Old Shop config key name')
  .requiredOption('--newKeyName <name>', 'New Shop config key name')

if (!process.argv.slice(1).length) {
  program.outputHelp()
  process.exit(1)
}
program.parse(process.argv)

/**
 *@param {*} config
 *@returns {Promise<Array<models.Shop>>}
 */
async function _getShops(options) {
  let shops
  if (options.shopId) {
    const shop = await Shop.findOne({ where: { id: options.shopId } })
    if (!shop) {
      throw new Error(`No shop with id ${options.shopId}`)
    }
    log.info(`Loaded shop ${shop.name} (${shop.id})`)
    shops = [shop]
  } else if (options.shopName) {
    const shop = await Shop.findOne({ where: { name: options.shopName } })
    if (!shop) {
      throw new Error(`No shop with name ${options.shopName}`)
    }
    log.info(`Loaded shop ${shop.name} (${shop.id})`)
    shops = [shop]
  } else if (options.allShops) {
    log.info(`Executing program for all shops`)
    shops = await Shop.findAll({ order: [['id', 'asc']] })
    log.info(`Loaded ${shops.length} shops`)
  } else {
    throw new Error('Must specify shopId or shopName')
  }
  return shops
}

/**
 *@param {models.Shop} shop
 *@param {String} oldKeyName
 *@param {String} newKeyName
 *@returns {<null>}
 */
function renameKey(shop, oldKeyName, newKeyName) {
  const shopConfigRaw = fs.readFileSync(
    `${DSHOP_CACHE}/${shop.shopSlug}/data/config.json`
  )
  let shopConfig = JSON.parse(shopConfigRaw)
  const keys = Object.keys(shopConfig)

  if (keys.includes(oldKeyName) && keys.includes(newKeyName)) {
    shopConfig[newKeyName] = shopConfig[oldKeyName]
    delete shopConfig[oldKeyName]
  } else if (keys.includes(oldKeyName) && !keys.includes(newKeyName)) {
    shopConfig = Object.defineProperty(
      shopConfig,
      newKeyName,
      Object.getOwnPropertyDescriptor(shopConfig, oldKeyName)
    )
    delete shopConfig[oldKeyName]
  } else if (!keys.includes(oldKeyName) && keys.includes(newKeyName)) {
    log.info(
      `Skipping shop '${shopConfig.fullTitle}'. Config only has '${newKeyName}'.`
    )
    return
  } else {
    console.error(
      `Error in renaming key for the shop ${shopConfig.fullTitle}. shopID: ${shop.id}`
    )
  }

  fs.writeFileSync(
    `${DSHOP_CACHE}/${shop.shopSlug}/data/config.json`,
    JSON.stringify(shopConfig, null, 2)
  )
  log.info(`Renaming complete for the shop '${shopConfig.fullTitle}'.`)
}

async function main(config) {
  const opts = config.opts() //options passed to the script
  const shops = await _getShops(opts)
  log.info(
    `Renaming ${opts.oldKeyName} to ${opts.newKeyName} on ${
      opts.shopId
        ? `the shop with shopId ${opts.shopId}`
        : opts.shopName
        ? `the shop called '${opts.shopName}'`
        : `all shops`
    }`
  )
  for (const shop of shops) {
    renameKey(shop, opts.oldKeyName, opts.newKeyName)
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
