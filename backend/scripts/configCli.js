// A utility script for shop configs.
//
// Note: easiest is to run the script from local after having setup
// a SQL proxy to prod and the ENCRYPTION_KEY env var.
//
// Examples:
//  - dump network and shop config
//  node configCli.js --networkId=1 --shopName=<shopName> --operation=dump
//  - get a shop's config value for a specific key
//  node configCli.js --networkId=1 --shopName=<shopName> --operation=get --key=<key>
//  - get a config value for all the shops
//  node configCli.js --networkId=1 --allShops --operation=get --key=<key>
//  - set a shop's config value
//  node configCli.js --networkId=1 --shopName=<shopName> --operation=get --key=<key> --value=<value>
//  - get a shop's raw config
//  node configCli.js --networkId=1 --shopName=<shopName> --operation=getRaw
//  - set a shop's raw config
//  node configCli.js --networkId=1 --shopName=<shopName> --operation=setRaw --value=<value>
//  - check a shop's config
//  node configCli.js --networkId=1 --allShops --operation=checkConfig
//
const { get, pick } = require('lodash')
const program = require('commander')

const { Network, Shop, AdminLog } = require('../models')
const { getLogger } = require('../utils/logger')
const { genPGP, testPGP } = require('../utils/pgp')
const { getConfig, setConfig, decrypt } = require('../utils/encryptedConfig')
const { checkStripeConfig } = require('../logic/payments/stripe')
const {
  checkPrintfulWebhook,
  deregisterPrintfulWebhook,
  registerPrintfulWebhook
} = require('../logic/printful/webhook')
const { diagnoseShop } = require('../logic/shop/health')
const { AdminLogActions } = require('../enums')

const log = getLogger('cli')

program
  .requiredOption(
    '-o, --operation <operation>',
    'Action to perform: [dump|get|set|del]'
  )
  .requiredOption('-n, --networkId <id>', 'Network id: [1,4,999]')
  .option('-i, --shopId <id>', 'Shop Id')
  .option('-n, --shopName <name>', 'Shop Name')
  .option('-a, --allShops', 'Apply the operation to all shops')
  .option('-k, --key <name>', 'Shop config key')
  .option('-v, --value <name>', 'Shop config value')
  .option('-l, --logId <id>', 'Log Id')

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

/**
 * Dumps a shop config on the console.
 * @param {models.Network} network
 * @param {models.Shop} shop
 * @returns {Promise<void>}
 */
async function dump(network, shops) {
  const networkConfig = getConfig(network.config)
  log.info('Network Id:', network.networkId)
  log.info('Network Config:')
  log.info(networkConfig)
  log.info('======================')
  for (const shop of shops) {
    const shopConfig = getConfig(shop.config)
    log.info('Shop Id:', shop.id)
    log.info('Shop Name:', shop.name)
    log.info('Shop Config:')
    log.info(shopConfig)
  }
}

async function getKey(shops, key) {
  if (!key) {
    throw new Error('Argument key must be defined')
  }
  for (const shop of shops) {
    try {
      const shopConfig = getConfig(shop.config)
      log.info(`Shop ${shop.id} ${shop.name} config: ${key}=${shopConfig[key]}`)
    } catch (e) {
      log.error(
        `Failed loading shop config for shop ${shop.id} ${shop.name}: ${e}`
      )
    }
  }
}

async function setKey(shops, key, val) {
  if (shops.length > 1) {
    throw new Error('Set operation not supported on more than 1 shop.')
  }
  const shop = shops[0]
  if (!key) {
    throw new Error('Argument key must be defined')
  }
  if (!val) {
    throw new Error('Argument value must be defined')
  }
  log.info(`Setting ${key} to ${val} on the shop's config...`)
  const shopConfig = getConfig(shop.config)
  shopConfig[key] = val
  shop.config = setConfig(shopConfig, shop.config)
  await shop.save()
  log.info('Done')
}

/**
 * Checks the validity of PGP config.
 * @param shops
 * @returns {Promise<void>}
 */
async function checkPgp(shops) {
  for (const shop of shops) {
    let shopConfig
    try {
      shopConfig = getConfig(shop.config)
    } catch (e) {
      log.error(`Failed loading shop config ${shop.id} ${shop.name}: ${e}`)
      continue
    }
    try {
      const { pgpPrivateKeyPass, pgpPublicKey, pgpPrivateKey } = shopConfig
      testPGP({ pgpPrivateKeyPass, pgpPublicKey, pgpPrivateKey })
    } catch (e) {
      log.error(`Invalid PGP key: ${e.message}`)
      continue
    }
    // TODO: check config.json

    log.info(`PGP config OK for shop ${shop.id} ${shop.name}`)
  }
}

async function resetPgp(shops) {
  if (shops.length > 1) {
    throw new Error('resetPgp operation not supported on more than 1 shop.')
  }
  const shop = shops[0]

  const pgpKeys = await genPGP()
  log.info('Reseting PGP keys for shop to', pgpKeys)
  let shopConfig = getConfig(shop.config)
  shopConfig = { ...shopConfig, ...pgpKeys }
  shop.config = setConfig(shopConfig, shop.config)
  await shop.save()
  log.info('Done')
  // TODO: should also automate updating config.json file on disk.
  log.info(
    'IMPORTANT: config.json pgpPublicKey should be updated and the shop re-published'
  )
}

async function setRawConfig(shops, val) {
  if (shops.length > 1) {
    throw new Error('Set operation not supported on more than 1 shop.')
  }
  const shop = shops[0]
  if (!val) {
    throw new Error('Argument value must be defined')
  }
  log.info(`Setting shop's raw config...`)
  const shopConfig = val
  shop.config = setConfig(shopConfig, shop.config)
  await shop.save()
  log.info('Done')
}

async function getRawConfig(shops) {
  if (shops.length > 1) {
    throw new Error('Set operation not supported on more than 1 shop.')
  }
  const shop = shops[0]
  log.info('Shop Raw Config:')

  const [iv, configRaw] = shop.config.split(':')
  log.info(decrypt(Buffer.from(iv, 'hex'), configRaw))
  log.info('Done')
}

async function delKey(shops, key) {
  if (shops.length > 1) {
    throw new Error('Del operation not supported on more than 1 shop.')
  }
  if (!key) {
    throw new Error('Argument key must be defined')
  }
  const shop = shops[0]
  log.info(`Deleting ${key} from the shop's config...`)
  const shopConfig = getConfig(shop.config)
  delete shopConfig[key]
  shop.config = setConfig(shopConfig, shop.config)
  await shop.save()
  log.info('Done')
}

async function checkStripe(network, shops) {
  const networkConfig = getConfig(network.config)
  for (const shop of shops) {
    log.info(`Checking Stripe config for shop ${shop.id} ${shop.name}`)
    const shopConfig = getConfig(shop.config)
    const { success, error } = await checkStripeConfig(
      shop,
      shopConfig,
      networkConfig
    )
    if (success) {
      log.info(`Shop ${shop.id} - Successfully verified Stripe configuration`)
    } else {
      log.error(`Shop ${shop.id} - ${error}`)
    }
  }
}

async function checkPrintful(network, shops) {
  const networkConfig = getConfig(network.config)
  for (const shop of shops) {
    log.info(`Checking Printful webhook for shop ${shop.id} ${shop.name}`)
    try {
      const shopConfig = getConfig(shop.config)
      if (!shopConfig.printful) {
        log.info(`Shop ${shop.id} - Prinful not configured.`)
        continue
      }
      await checkPrintfulWebhook(shop.id, shopConfig, networkConfig)
      log.info(
        `Shop ${shop.id} - Successfully verified Printful webhook config`
      )
    } catch (err) {
      log.error(`Shop ${shop.id} - ${err.message}`)
    }
  }
}

async function fixPrintfulWebhook(network, shops) {
  const networkConfig = getConfig(network.config)
  let numFixed = 0
  for (const shop of shops) {
    log.info(`Fixing Printful webhook for shop ${shop.id} ${shop.name}`)
    let shopConfig
    try {
      shopConfig = getConfig(shop.config)
    } catch (e) {
      log.info(`Shop ${shop.id} - Failed reading config. Skipping`)
      continue
    }
    if (!shopConfig.printful) {
      log.info(`Shop ${shop.id} - Prinful not configured. Skipping`)
      continue
    }

    // Check if the webhook is misconfigured
    try {
      await checkPrintfulWebhook(shop.id, shopConfig, networkConfig)
      log.info(
        `Shop ${shop.id} - Successfully verified Printful webhook config`
      )
      continue
    } catch (err) {
      log.error(`Shop ${shop.id} - Webhook misconfigured: ${err.message}`)
      // We only want to fix errors we expect.
      // For example if the webhook points to a non dshop related URL, we want
      // to leave it alone since the merchant could be using Printful on another platform.
      // Another example would be an invalid API key
      const fixableErrors = [
        'Webhook URL points at dev URL',
        'Webhook URL points at an ogn.app subdomain',
        'No webhook registered',
        'Invalid webhook URL secret'
      ]
      if (!fixableErrors.includes(err.message)) {
        log.error(
          `Shop ${shop.id} - Skipping. Non fixable error ${err.message}`
        )
        continue
      }
    }

    // De-register the webhook
    log.info(`Shop ${shop.id} - De-registering Printful webhook`)
    await deregisterPrintfulWebhook(shop.id, shopConfig)

    // Re-register it
    log.info(`Shop ${shop.id} - Registering Printful webhook`)
    const printfulWebhookSecret = await registerPrintfulWebhook(
      shop.id,
      shopConfig,
      networkConfig.backendUrl
    )

    // Save the new secret in the shop's DB config.
    log.info(
      `Shop ${shop.id} - Saving printfulWebhookSecret=${printfulWebhookSecret} in shop's config`
    )
    shopConfig['printfulWebhookSecret'] = printfulWebhookSecret
    shop.config = setConfig(shopConfig, shop.config)
    await shop.save()

    numFixed++
  }
  log.info(`Fixed ${numFixed} shops`)
}

async function checkShopConfig(shops) {
  for (const shop of shops) {
    try {
      getConfig(shop.config)
    } catch (e) {
      log.error(`Failed checking config for shop ${shop.id} ${shop.name}: ${e}`)
    }
  }
}

async function diagnose(shops) {
  for (const shop of shops) {
    const diagnostic = await diagnoseShop(shop)
    for (const [key, item] of Object.entries(diagnostic)) {
      console.log(key.padEnd(24, ' '), item.status)
      if (item.status === 'ERROR') {
        console.log(item.errors.map((e) => '  - ' + e).join('\n'))
      }
    }
  }
}

async function adminLogs(shops) {
  for (const shop of shops) {
    const logs = await AdminLog.findAll({
      where: { shopId: shop.id },
      order: [['id', 'asc']]
    })
    for (const log of logs) {
      // Trim the data display for shop config actions since it is large.
      let data = log.data
      if (log.action === AdminLogActions.ShopConfigUpdated) {
        data = pick(data, ['diffKeys'])
      }
      const date = log.createdAt.toLocaleString()
      console.log(
        `${log.id}\t${log.sellerId}\t${date}\t${log.action}\t${JSON.stringify(
          data
        )}`
      )
    }
  }
}

async function adminLog(logId) {
  const log = await AdminLog.findOne({ where: { id: logId } })
  if (!log) {
    console.log('ERROR: no row in admin_logs table with id', logId)
    return
  }
  if (log.action === AdminLogActions.ShopConfigUpdated) {
    const oldConfigRaw = get(log, 'data.oldShop.config')
    if (!oldConfigRaw) {
      console.log('ERROR: missing key data.oldShop.config')
      return
    }

    const oldConfig = getConfig(oldConfigRaw)
    console.log('Old config:', JSON.stringify(oldConfig, null, 2))
  } else {
    console.log('Log:', JSON.stringify(log.get({ plain: true })))
  }
}

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
  const shops = await _getShops(config)

  if (config.operation === 'dump') {
    await dump(network, shops)
  } else if (config.operation === 'get') {
    await getKey(shops, config.key)
  } else if (config.operation === 'set') {
    await setKey(shops, config.key, config.value)
  } else if (config.operation === 'setRaw') {
    await setRawConfig(shops, config.value)
  } else if (config.operation === 'getRaw') {
    await getRawConfig(shops)
  } else if (config.operation === 'del') {
    await delKey(shops, config.key, config.value)
  } else if (config.operation === 'checkStripe') {
    await checkStripe(network, shops)
  } else if (config.operation === 'checkPrintful') {
    await checkPrintful(network, shops)
  } else if (config.operation === 'fixPrintfulWebhook') {
    await fixPrintfulWebhook(network, shops)
  } else if (config.operation === 'checkConfig') {
    await checkShopConfig(shops)
  } else if (config.operation === 'resetPgp') {
    await resetPgp(shops)
  } else if (config.operation === 'checkPgp') {
    await checkPgp(shops)
  } else if (config.operation === 'diagnose') {
    await diagnose(shops)
  } else if (config.operation === 'logs') {
    await adminLogs(shops)
  } else if (config.operation === 'log') {
    await adminLog(config.logId)
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
