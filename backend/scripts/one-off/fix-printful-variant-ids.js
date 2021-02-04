// A utility script for fixing printful shops' variant IDs.
// Related to issue #883

const fs = require('fs')

const { Shop } = require('../../models')
const { DSHOP_CACHE } = require('../../utils/const')
const { getLogger } = require('../../utils/logger')
const log = getLogger('cli')

const program = require('commander')

program
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

async function fixVariants(shops) {
  for (const shop of shops) {
    log.info(`Processing Shop ${shop.id} DataDir ${shop.authToken}`)

    const SHOP_PREFIX = `${DSHOP_CACHE}/${shop.authToken}/data`

    // Read printful-ids.json file
    const printfulIdsFile = `${SHOP_PREFIX}/printful-ids.json`
    if (!fs.existsSync(printfulIdsFile)) {
      log.error(`Shop ${shop.id}: file ${printfulIdsFile} not found`)
      continue
    }

    const printfulIds = JSON.parse(fs.readFileSync(printfulIdsFile).toString())

    for (const productId of Object.keys(printfulIds)) {
      const productDataFile = `${SHOP_PREFIX}/${productId}/data.json`
      if (!fs.existsSync(productDataFile)) {
        log.error(`Shop ${shop.id}: file ${productDataFile} not found`)
        continue
      }

      const printfulVariantsMap = printfulIds[productId]

      const productData = JSON.parse(
        fs.readFileSync(productDataFile).toString()
      )

      const brokenVariants = productData.variants.filter(
        (v) => !printfulVariantsMap[v.id]
      )

      if (!brokenVariants.length) {
        continue
      }

      log.error(`Found ${brokenVariants.length} broken variants.`)

      // Flip (k => v) to (v => k), easier to look up values
      const flippedVariantsMap = Object.keys(printfulVariantsMap).reduce(
        (all, k) => ({
          ...all,
          [printfulVariantsMap[k]]: parseInt(k)
        }),
        {}
      )

      const fixedVariants = productData.variants.map((v) => {
        const correctId = flippedVariantsMap[v.externalId]
        if (v.id !== correctId) {
          log.info(
            `Will change ID of variant ${v.externalId} from ${v.id} to ${correctId}`
          )

          return {
            ...v,
            id: correctId
          }
        }

        return { ...v }
      })

      productData.variants = fixedVariants

      if (program.doIt) {
        log.info(`Writing to ${productDataFile}...`)
        const raw = JSON.stringify(productData, null, 2)
        fs.writeFileSync(productDataFile, raw)
        log.info('Done.')
      } else {
        log.info(`Would write to ${productDataFile}`)
      }
    }
  }
}

async function main() {
  const shops = await _getShops()
  await fixVariants(shops)
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
