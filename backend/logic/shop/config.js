const ethers = require('ethers')
const fs = require('fs')
const mv = require('mv')
const path = require('path')
const { get, set, kebabCase, pick, uniq, isEqual } = require('lodash')

const { validateStripeKeys } = require('@origin/utils/stripe')

const { AdminLog, Network, Sequelize, Shop } = require('../../models')
const { getShopDataUrl, getShopPublicUrl } = require('../../utils/shop')
const {
  deregisterPrintfulWebhook,
  registerPrintfulWebhook
} = require('../../utils/printful')
const paypalUtils = require('../../utils/paypal')
const stripeUtils = require('../../utils/stripe')
const { DSHOP_CACHE } = require('../../utils/const')
const { getConfig, setConfig } = require('../../utils/encryptedConfig')
const { getLogger } = require('../../utils/logger')
const { AdminLogActions } = require('../../enums')

const log = getLogger('logic.shop.config')

/**
 * Utility function to move offline payment images (QR code for ex.) from
 * the upload area to the shop's data directory.
 *
 * @param {object} paymentMethods
 * @param {string} dataDir: the shop's data directory name.
 * @returns {Promise<[]>}
 */
async function moveOfflinePaymentMethodImages(paymentMethods, dataDir) {
  const out = []
  const tmpDir = path.resolve(`${DSHOP_CACHE}/${dataDir}/data/__tmp`)

  for (const m of paymentMethods) {
    const imagePath = m.qrImage
    if (imagePath && imagePath.includes('/__tmp/')) {
      const fileName = imagePath.split('/__tmp/', 2)[1]
      const tmpFilePath = `${tmpDir}/${fileName}`

      const targetDir = path.resolve(`${DSHOP_CACHE}/${dataDir}/data/uploads`)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      const targetPath = `${targetDir}/${fileName}`

      const movedFileName = await new Promise((resolve) => {
        mv(tmpFilePath, targetPath, (err) => {
          if (err) {
            console.error(`Couldn't move file`, tmpFilePath, targetPath, err)
          }
          resolve(fileName)
        })
      })

      out.push({
        ...m,
        qrImage: movedFileName
      })
    } else {
      out.push(m)
    }
  }

  return out
}

/**
 * Utility method to compute the keys that have changed between 2 shop objects.
 * Used for logging admin activity.
 *
 * @param {object} newShop: plain representation of the new shop DB model
 * @param {object} oldShop: plain representation of the old shop DB model
 * @return {object} Differences
 */
function getShopDiffKeys(newShop, oldShop) {
  const diff = []
  // Generate a set of keys present in either new/old shop.
  // Filter out keys that are not part of the shops table schema (the shop object
  // gets decorated with various other keys that are not relevant to this method).
  const validKeys = Object.keys(Shop.rawAttributes)
  let keys = uniq(
    Object.keys(newShop).concat(Object.keys(oldShop))
  ).filter((k) => validKeys.includes(k))
  for (const key of keys) {
    if (key === 'config') {
      // config is handled as a special case below.
      continue
    }
    if (newShop[key] !== oldShop[key]) {
      diff.push(key)
    }
  }

  const newConfig = getConfig(newShop.config)
  const oldConfig = getConfig(oldShop.config)
  keys = uniq(Object.keys(newConfig).concat(Object.keys(oldConfig)))
  for (const key of keys) {
    // Using isEqual to do a deep comparison since the values could be objects.
    if (!isEqual(newConfig[key], oldConfig[key])) {
      diff.push(`config.${key}`)
    }
  }
  return diff
}

/**
 * Updates a shop configuration.
 * Saves the config data in the DB and on disk. Handle the logic to configure
 * integrations (payments, fulfillment, etc...) based on config changes.
 *
 * TODO:
 *  - This method is not atomic. Any failure to update an on-disk config does not
 * get rolled back and may result in inconsistent data between the DB and the disk.
 *  - Validate fields before persisting them. Foe example currency, discountCodes, etc...
 *
 * @param {models.Shop} shop
 * @param {object} data: configuration data
 * @returns {Promise<{reason: string, field: string, success: boolean}|{success: boolean}|{reason: string, success: boolean}>}
 */
async function updateShopConfig({ seller, shop, data }) {
  const shopId = shop.id
  log.info(`Shop ${shopId}: updateShopConfig called`)

  const oldShop = { ...shop.get({ plain: true }) } // take a snapshot of the current shop object prior to updating it.
  const dataOverride = {}

  // Pick fields relevant to main section of the shop's config.json.
  const jsonConfig = pick(
    data,
    'currency',
    'metaDescription',
    'css',
    'emailSubject',
    'cartSummaryNote',
    'byline',
    'discountCodes',
    'stripe',
    'stripeKey',
    'title',
    'fullTitle',
    'facebook',
    'twitter',
    'instagram',
    'medium',
    'youtube',
    'about',
    'logErrors',
    'paypalClientId',
    'offlinePaymentMethods',
    'supportEmail',
    'upholdClient',
    'useEscrow',
    'shippingApi',
    'taxRates',
    'themeId',
    'gaCode'
  )
  // Pick fields relevant to the network section of the shop's config.json.
  const jsonNetConfig = pick(
    data,
    'acceptedTokens',
    'customTokens',
    'listingId',
    'disableCryptoPayments',
    'walletAddress'
  )

  // Load the existing shop config from the DB.
  const existingConfig = getConfig(shop.config)

  // Load the network config from the DB.
  const network = await Network.findOne({ where: { active: true } })
  const netConfig = getConfig(network.config)

  // Update fields that are stored directly on the shop DB row rather than in the config blob.
  if (data.fullTitle) {
    shop.name = data.fullTitle
  }
  if (data.listingId) {
    if (!String(data.listingId).match(/^[0-9]+-[0-9]+-[0-9]+$/)) {
      return { success: false, reason: 'Invalid listingId format' }
    }
    shop.listingId = data.listingId
  }
  if (data.walletAddress) {
    let walletAddress
    // Validate the address and checksum it before storing it.
    try {
      walletAddress = ethers.utils.getAddress(data.walletAddress)
    } catch (e) {
      return { success: false, reason: 'Invalid wallet address' }
    }
    shop.walletAddress = walletAddress
  }

  //
  // Configure the shop's hostname.
  //
  if (data.hostname) {
    const hostname = kebabCase(data.hostname)
    // Check the hostname picked by the merchant is available.
    const existingShops = await Shop.findAll({
      where: { hostname, [Sequelize.Op.not]: { id: shopId } }
    })
    if (existingShops.length) {
      return { success: false, reason: 'Name unavailable', field: 'hostname' }
    }
    shop.hostname = hostname

    // Unless explicitly set by the UI, update the public and dataUrl in the
    // shop's DB config to reflect the change to the hostname.
    if (!data.publicUrl) {
      dataOverride.publicUrl = getShopPublicUrl(shop, netConfig)
    }
    if (!data.dataUrl) {
      dataOverride.dataUrl = getShopDataUrl(shop, netConfig)
    }
  }

  //
  // Configure Stripe
  //
  if (data.stripe) {
    log.info(`Shop ${shopId} - Registering Stripe webhook`)

    const validKeys = validateStripeKeys({
      publishableKey: data.stripeKey,
      secretKey: data.stripeBackend
    })

    if (!validKeys) {
      return { success: false, reason: 'Invalid Stripe credentials' }
    }

    const { secret } = await stripeUtils.registerWebhooks(
      shop,
      data,
      existingConfig,
      data.stripeWebhookHost || netConfig.backendUrl
    )
    dataOverride.stripeWebhookSecret = secret
  } else {
    log.info(`Shop ${shopId} - De-registering Stripe webhook`)
    await stripeUtils.deregisterWebhooks(shop, existingConfig)
    dataOverride.stripeWebhookSecret = ''
    dataOverride.stripeWebhookHost = ''
    dataOverride.stripeBackend = ''
  }

  //
  // Configure PayPal
  ///
  if (data.paypal) {
    log.info(`Shop ${shopId} - Registering PayPal webhook`)
    const client = paypalUtils.getClient(
      netConfig.paypalEnvironment,
      data.paypalClientId,
      data.paypalClientSecret
    )
    const valid = await paypalUtils.validateCredentials(client)
    if (!valid) {
      return { success: false, reason: 'Invalid PayPal credentials' }
    }

    if (existingConfig.paypal && existingConfig.paypalWebhookId) {
      await paypalUtils.deregisterWebhook(shopId, existingConfig, netConfig)
    }
    const result = await paypalUtils.registerWebhooks(
      shopId,
      { ...existingConfig, ...data },
      netConfig
    )
    dataOverride.paypalWebhookId = result.webhookId
  } else if (existingConfig.paypal && data.paypal === false) {
    log.info(`Shop ${shopId} - De-registering PayPal webhook`)

    await paypalUtils.deregisterWebhook(shopId, existingConfig, netConfig)
    dataOverride.paypalWebhookId = null
  }

  //
  // Configure offline payment
  //
  // Add offlinePaymentMethods to the data saved in config.json
  if (data.offlinePaymentMethods) {
    jsonConfig.offlinePaymentMethods = await moveOfflinePaymentMethodImages(
      data.offlinePaymentMethods,
      shop.authToken
    )
  }
  // Add offlinePaymentMethods to the data saved in the DB.
  if (jsonConfig.offlinePaymentMethods) {
    dataOverride.offlinePaymentMethods = jsonConfig.offlinePaymentMethods
  }

  //
  // Configure Printful
  //
  if (data.printful) {
    log.info(`Shop ${shopId} - Registering Printful webhook`)
    const printfulWebhookSecret = await registerPrintfulWebhook(
      shopId,
      { ...existingConfig, ...data },
      netConfig.backendUrl
    )

    dataOverride.printfulWebhookSecret = printfulWebhookSecret
  } else if (existingConfig.printful && data.printful === false) {
    log.info(`Shop ${shopId} - De-registering Printful webhook`)
    await deregisterPrintfulWebhook(shopId, existingConfig)
    dataOverride.printfulWebhookSecret = ''
  }

  //
  // Update the configs on disk.
  //
  log.info(`Shop ${shopId} - Saving config on disk.`)

  // Save config.json on disk.
  if (Object.keys(jsonConfig).length || Object.keys(jsonNetConfig).length) {
    const configFile = `${DSHOP_CACHE}/${shop.authToken}/data/config.json`

    if (!fs.existsSync(configFile)) {
      return { success: false, reason: 'Failed loading config.json from disk' }
    }

    try {
      const raw = fs.readFileSync(configFile).toString()
      const config = JSON.parse(raw)
      const newConfig = { ...config, ...jsonConfig }
      if (Object.keys(jsonNetConfig).length) {
        set(newConfig, `networks.${network.networkId}`, {
          ...get(newConfig, `networks.${network.networkId}`),
          ...jsonNetConfig
        })
      }

      const jsonStr = JSON.stringify(newConfig, null, 2)
      fs.writeFileSync(configFile, jsonStr)
    } catch (e) {
      log.error(e)
      return { success: false, reason: 'Failed to update config.json' }
    }
  }

  // Save the about file on disk.
  if (data.about) {
    const dataDir = `${DSHOP_CACHE}/${shop.authToken}/data`
    const aboutFile = `${dataDir}/${data.about}`

    try {
      fs.writeFileSync(aboutFile, data.aboutText)
    } catch (e) {
      log.error('Failed to update about file', dataDir, aboutFile, e)
      return { success: false, reason: 'Failed to update about file' }
    }
  }

  //
  // Save the config in the DB.
  //
  log.info(`Shop ${shopId} - Saving config in the DB.`)
  const shopConfigFields = pick(
    { ...existingConfig, ...data, ...dataOverride },
    'awsAccessKey',
    'awsAccessSecret',
    'awsRegion',
    'bigQueryCredentials',
    'bigQueryTable',
    'dataUrl',
    'deliveryApi',
    'email',
    'emailSubject',
    'hostname',
    'listener',
    'mailgunSmtpLogin',
    'mailgunSmtpPassword',
    'mailgunSmtpPort',
    'mailgunSmtpServer',
    'offlinePaymentMethods',
    'password',
    'paypal',
    'paypalClientId',
    'paypalClientSecret',
    'paypalWebhookHost',
    'paypalWebhookId',
    'pgpPrivateKey',
    'pgpPrivateKeyPass',
    'pgpPublicKey',
    'printful',
    'printfulAutoFulfill',
    'processingTime',
    'publicUrl',
    'sendgridApiKey',
    'sendgridPassword',
    'sendgridUsername',
    'shippingFrom',
    'stripeBackend',
    'stripeWebhookSecret',
    'stripeWebhookHost',
    'supportEmail',
    'upholdApi',
    'upholdClient',
    'upholdSecret',
    'web3Pk'
  )
  // Save the updated shop data in the DB.
  shop.config = setConfig(shopConfigFields, shop.config) // encrypt the config.
  shop.hasChanges = true
  await shop.save()

  // Record the admin activity.
  const diffKeys = getShopDiffKeys(shop.get({ plain: true }), oldShop)
  await AdminLog.create({
    action: AdminLogActions.ShopConfigUpdated,
    sellerId: seller.id,
    shopId,
    // Store in data the old version of the shop row as well as a list of keys that changed.
    data: { oldShop, diffKeys },
    createdAt: Date.now()
  })

  log.info(`Shop ${shopId} - config updated. Diff keys: ${diffKeys}`)
  return { success: true }
}

module.exports = {
  updateShopConfig
}
