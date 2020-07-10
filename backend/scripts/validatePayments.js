const stripeRaw = require('stripe')
require('dotenv').config()
const { Shop, Order } = require('../models')
const encConf = require('../utils/encryptedConfig')
const { getLogger } = require('../utils/logger')
const program = require('commander')


const log = getLogger('script')


program
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-n, --shopName <name>', 'Shop Name')

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

async function _getShop() {
  let shop
  if (program.shopId) {
    shop = await Shop.findOne({ where: { id: program.shopId } })
    if (!shop) {
      throw new Error(`No shop with id ${program.shopId}`)
    }
  } else if (program.shopName) {
    shop = await Shop.findOne({ where: { name: program.shopName } })
    if (!shop) {
      throw new Error(`No shop with name ${program.shopName}`)
    }
  } else {
    throw new Error('Must specify shopId or shopName')
  }
  return shop
}

async function validate() {
  const shop = await _getShop()

  const stripeKey = await encConf.get(shop.id, 'stripeBackend')
  if (!stripeKey) {
    throw new Error('No stripe key')
  }
  log.info(`StripeKey=`)

  const orders = await Order.findAll({ where: { shopId: shop.id } })
  const encryptedHashes = orders
    .map((o) => o.encryptedIpfsHash)
    .filter((i) => i)
  log.info(`Found ${encryptedHashes.length} orders with encrypted hashes`)

  const stripe = stripeRaw(stripeKey)

  let after

  do {
    await new Promise((resolve) => {
      const eventArgs = {
        limit: 100,
        type: 'payment_intent.succeeded',
        starting_after: after
      }
      log.info(`Fetching events after ${after}`)

      stripe.events.list(eventArgs, function (err, events) {
        console.log(`Found ${events.data.length} completed Stripe payments`)
        events.data.forEach((item) => {
          const { shopId, encryptedData } = item.data.object.metadata
          if (Number(shopId) !== shop.id) {
            /* Ignore */
          } else if (encryptedHashes.indexOf(encryptedData) < 0) {
            log.info(
              `No order with hash ${encryptedData}. Created ${new Date(item.created*1000)}. Amount ${item.data.object.amount}`
            )
          } else {
            log.info(`Found hash ${encryptedData} OK`)
          }
        })
        after = events.data.length >= 100 ? events.data[99].id : null
        resolve()
      })
    })
  } while (after)
}

validate()
  .then(() => {
    log.info('Finished')
    process.exit()
  })
  .catch((err) => {
    log.error('Failure: ', err)
    log.error('Exiting')
    process.exit(-1)
  })
