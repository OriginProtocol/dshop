const program = require('commander')
const fetch = require('node-fetch')

const { Shop } = require('../models')
const { getConfig } = require('../utils/encryptedConfig')

const STRIPE_WEBHOOKS_ENDPOINT = 'https://api.stripe.com/v1/webhook_endpoints'

function basicAuthHeader(user, pass) {
  const creds = Buffer.from(`${user}:${pass}`, 'utf-8').toString('base64')
  return `Basic ${creds}`
}

/**
 * Get and decrypt config to a usable object
 *
 * @param shopId {number} - ID of the shop
 * @returns {object} - config object
 */
async function getConf(shopId) {
  const shop = await Shop.findOne({
    where: {
      id: shopId
    }
  })

  if (!shop) {
    throw new Error(`Shop ${shopId} not found`)
  }
  console.debug('shop:', shop)
  return getConfig(shop.config)
}

/**
 * Fetch all webhooks from the Stripe API for the given key
 *
 * @param shopId {number} - ID of the shop
 * @returns {object} - config object
 */
async function fetchWebhooks(stripeSecretKey) {
  const res = await fetch(STRIPE_WEBHOOKS_ENDPOINT, {
    headers: {
      authorization: basicAuthHeader(stripeSecretKey, '')
    }
  })

  if (!res.ok) {
    console.error(`request to ${STRIPE_WEBHOOKS_ENDPOINT} failed!`)
    console.debug(res)
  }

  const jason = await res.json()
  return jason.data
}

async function main(argv) {
  program.option('-d, --debug', 'output extra debugging')

  // list-webhooks command definition and handler
  program
    .command('list-webhooks <shopId>')
    .description('list webhook data for a shop')
    .action(async (shopId) => {
      console.log(`list-webhooks shop: ${shopId}`)

      const config = await getConf(shopId)
      console.debug('config:', config)
      if (!config.stripeBackend) {
        console.error('No Stripe secret key configured for this shop')
        process.exit(1)
      }

      const hooks = await fetchWebhooks(config.stripeBackend)
      console.log('hooks:', hooks)
    })

  program.parse(argv)
}

if (require.main === module) {
  main(process.argv)
}
