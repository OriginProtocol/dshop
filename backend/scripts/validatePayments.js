// A script to reconcile Stripe payment records with Dshop orders.
// Fetches the events in the last 30 days from Stripe and checks there is
// a corresponding entry in the orders table.
// Also allows to check the shops Stripe configuration for errors.
//
// The simplest for running it is to do the following:
// 1. Setup a proxy to prod DB on your local
// 2. Set DATABASE_URL to point to local proxy
// 3. Run the script locally.
//    For example to validate payment data for shop Id 2:
//       node validatePayments.js --type=payment --shopId=2
//    To valide Stripe config for all the shops:
//       node validatePayments.js --type=config

const stripeRaw = require('stripe')
require('dotenv').config()
const { Shop, Order } = require('../models')
const encConf = require('../utils/encryptedConfig')
const { getLogger } = require('../utils/logger')
const program = require('commander')

const log = getLogger('script')

program
  .requiredOption(
    '-t, --type <type>',
    'Type of verification to perform: payment or config'
  )
  .option('-a, --allShops', 'Run for all shops')
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-n, --shopName <name>', 'Shop Name')

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

// Helper. Loads a shop based on its shopId or Name.
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

// Load the Stripe payment in the last 30 days for a shop and
// check there is an associated order for each of them in the DB.
async function validateShopPayments(shop) {
  const stripeKey = await encConf.get(shop.id, 'stripeBackend')
  if (!stripeKey) {
    log.info('No stripe key configured')
    return
  }

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
      log.debug(`Fetching events after ${after}`)

      stripe.events.list(eventArgs, function (err, events) {
        if (!events) {
          return
        }
        if (!events.data) {
          log.warning('Events object with no data:', events)
          return
        }
        log.debug(
          `Found ${events.data.length} completed Stripe payments for key (may be shared with multiple dshops)`
        )
        events.data.forEach((item) => {
          const { shopId, encryptedData } = item.data.object.metadata
          if (Number(shopId) !== shop.id) {
            /* Ignore */
            // Note: the same Stripe key can be shared across multiple shops
            // which explains why we may be getting events for other shops.
          } else if (encryptedHashes.indexOf(encryptedData) < 0) {
            log.error(
              `No order with hash ${encryptedData}. Created ${new Date(
                item.created * 1000
              )}. Amount ${item.data.object.amount}`
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

// Validate payments for a shop or all shops.
async function validatePayments() {
  let shops
  if (program.allShops) {
    shops = await Shop.findAll({ order: [['id', 'asc']] })
  } else {
    shops = [await _getShop()]
  }
  for (const shop of shops) {
    log.info('=========================================')
    log.info(`Shop ${shop.name} id=${shop.id}`)
    try {
      await validateShopPayments(shop)
    } catch (e) {
      log.error('Shop validation failed:', e)
    }
  }
}

// Helper to hide sensitive data when printing on the console.
function hide(s) {
  return s.slice(0, 12) + '...'
}

// Go thru all the shops and check their Stripe configuration.
async function validateConfigs() {
  const shops = await Shop.findAll({ order: [['id', 'asc']] })

  // Build a dictionary of stripe key -> list of shops
  const keyToShops = new Map()
  for (const shop of shops) {
    log.info(`Processing shop ${shop.id} ${shop.name}`)
    try {
      // Decorate the shop object with the Stripe key and webhook secret.
      shop.stripeKey = await encConf.get(shop.id, 'stripeBackend')
      shop.stripeWebhookSecret = await encConf.get(
        shop.id,
        'stripeWebhookSecret'
      )
    } catch (e) {
      log.error(`Failed loading config: ${e}`)
      continue
    }

    if (!shop.stripeKey) {
      log.info(`Stripe not configured`)
      continue
    }
    if (!shop.stripeWebhookSecret) {
      log.error(`Stripe key found but no webhook secret`)
      continue
    }

    const existing = keyToShops[shop.stripeKey]
    if (existing) {
      keyToShops[shop.stripeKey].push(shop)
    } else {
      keyToShops[shop.stripeKey] = [shop]
    }
  }

  log.info('Checking configs for Stripe enabled shops...')
  for (const [key, shops] of Object.entries(keyToShops)) {
    // We expect all the shops with the same key to also have the same secret.
    const expectedSecret = shops[0].stripeWebhookSecret
    let error = false
    for (const shop of shops) {
      if (shop.stripeWebhookSecret !== expectedSecret) {
        error = true
      }
    }
    if (error) {
      log.error(
        `Shops sharing Stripe key ${hide(key)} have inconsistent secrets:`
      )
      for (const shop of shops) {
        log.error(
          `  Secret ${hide(shop.stripeWebhookSecret)} -> Shop Id=${
            shop.id
          } Name=${shop.name}`
        )
      }
    } else {
      log.info(
        `Verified ${
          shops.length
        } shop(s) with consistent webhook for key ${hide(key)}`
      )
    }
  }
}

async function main() {
  if (program.type === 'payment') {
    await validatePayments()
  } else if (program.type === 'config') {
    await validateConfigs()
  }
}

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
