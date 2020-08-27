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
//
//    Validate Stripe config for all the shops:
//       node validatePayments.js --type=config
//
//    Check Stripe webhook (does not fix it):
//       node validatePayments.js --type=webhook --allShops
//
//    Check and fix Stripe webhook for all shops
//       node validatePayments.js --type=webhook --allShops --doIt=true
//

const get = require('lodash/get')
const stripeRaw = require('stripe')
require('dotenv').config()
const program = require('commander')

const { Shop, Order, Network } = require('../models')
const encConf = require('../utils/encryptedConfig')

const { getWebhookData } = require('../utils/stripe')

const { getLogger } = require('../utils/logger')
const log = getLogger('script')

program
  .requiredOption(
    '-t, --type <type>',
    'Type of operation to perform: payment, config or webhook'
  )
  .option('-a, --allShops', 'Run for all shops')
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-n, --shopName <name>', 'Shop Name')
  .option('-d, --doIt <boolean>', 'Persist data to the DB.')

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
  log.info('Loaded shop', shop.name, shop.id)
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
            log.error(`Event id: ${item.id}`)
            log.error(`Event metadata: ${get(item, 'data.object.metadata')}`)
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

/**
 * Checks the validity of Stripe webhook.
 * Fixes it if the --doIt=true option is passed.
 */
async function validateWebhooks() {
  const network = await Network.findOne({ where: { active: true } })
  const netConfig = encConf.getConfig(network.config)
  const webhookUrl = `${netConfig.backendUrl}/webhook`

  let shops
  if (program.allShops) {
    shops = await Shop.findAll({ order: [['id', 'asc']] })
  } else {
    shops = [await _getShop()]
  }

  for (const shop of shops) {
    log.info(`Processing shop ${shop.id} ${shop.name}`)
    try {
      const stripeKey = await encConf.get(shop.id, 'stripeBackend')
      if (!stripeKey) {
        log.info('Stripe not configured.')
        continue
      }
      if (!stripeKey.includes('sk_live') && !stripeKey.includes('sk_test')) {
        log.error(`Invalid key: ${stripeKey}`)
        // TODO: clean up the invalid key from the shop's config.
        continue
      }

      const stripe = stripeRaw(stripeKey)
      const webhookEndpoints = await stripe.webhookEndpoints.list({
        limit: 100
      })

      const validWebhookIds = []
      for (const webhook of webhookEndpoints.data) {
        const id = webhook.id

        const url = webhook.url
        if (!url.includes('originprotocol.com') && !url.includes('ogn.app')) {
          // Not a Dshop webhook. Leave it alone.
          log.info(`OK. Not Dshop. Webhook id:${id} url:${url}`)
          continue
        }

        const isDshop = get(webhook, 'metadata.dshopStore')
        if (url === webhookUrl && isDshop) {
          // Properly configured dshop webhook. Nothing to do.
          log.info(`OK. DShop. Webhook id:${id} url:${url}`)
          validWebhookIds.push(id)
          continue
        }

        log.error(
          `Shop ${shop.name} (${shop.id}): Missing metadata or invalid URL. Webhook id:${id} url:${url}`
        )

        // Delete the invalid Dshop webhook.
        if (program.doIt) {
          await stripe.webhookEndpoints.del(id)
          log.info(`Deleted webhook id ${id}`)
        } else {
          log.info(`Would delete webhook id: ${id}`)
        }
      }

      if (validWebhookIds.length === 0) {
        // No valid webhook. Register a new one.
        const webhookData = getWebhookData(shop, webhookUrl)
        if (program.doIt) {
          log.info(`Registering new webhook for shop ${shop.id}...`)
          const endpoint = await stripe.webhookEndpoints.create(webhookData)
          log.info(
            `Shop ${shop.id}: Registered new webhook with id ${endpoint.id}`
          )
        } else {
          log.info(`Would register new webhook with data:`, webhookData)
        }
      } else if (validWebhookIds.length > 1) {
        // More than 1 valid webhook. Something is wrong.
        // De-register all of them and register a new one.
        log.error(
          `Found ${validWebhookIds.length} valid webhook. Expected only 1`
        )
        if (program.doIt) {
          for (const id of validWebhookIds) {
            log.info(`Deleting webhook ${id}`)
            await stripe.webhookEndpoints.del(id)
          }
          log.info(`Registering new webhook for shop ${shop.id}...`)
          const webhookData = getWebhookData(shop, webhookUrl)
          const endpoint = await stripe.webhookEndpoints.create(webhookData)
          log.info(`Shop ${shop.id}: Registered webhook id ${endpoint.id}`)
        } else {
          log.info(
            `Would deregister ${validWebhookIds.length} and register a new one.`
          )
        }
      }
    } catch (e) {
      log.error(e)
    }
  }
}

async function main() {
  if (program.type === 'payment') {
    await validatePayments()
  } else if (program.type === 'config') {
    await validateConfigs()
  } else if (program.type === 'webhook') {
    await validateWebhooks()
  } else {
    throw new Error(`Unsupported type ${program.type}`)
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
