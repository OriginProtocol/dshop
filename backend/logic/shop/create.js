const { execFile } = require('child_process')
const fs = require('fs')
const kebabCase = require('lodash/kebabCase')
const { isHexPrefixed, addHexPrefix } = require('ethereumjs-util')
const set = require('lodash/set')

const {
  getPublicUrl,
  getDataUrl,
  getDataDir,
  isValidDataDir
} = require('../../utils/shop')
const { genPGP } = require('../../utils/pgp')
const { DSHOP_CACHE } = require('../../utils/const')
const { getConfig, setConfig } = require('../../utils/encryptedConfig')
const { getLogger } = require('../../utils/logger')
const configs = require('../../config/baseConfig')
const { AdminLog, Shop, SellerShop, Network } = require('../../models')
const printfulSyncProcessor = require('../../queues/printfulSyncProcessor')
const { AdminLogActions } = require('../../enums')

const log = getLogger('logic.shop.create')

// Directory containing shop config templates.
const templatesDir = `${__dirname}/../../config/templates`

// List of shop config templates currently supported.
const supportedTemplateTypes = [
  'single-product',
  'multi-product',
  'affiliate',
  'empty'
]

/**
 * Utility to check the validity of a store name.
 * Only alphabetical characters, numbers, space, hyphen and apostrophe are allowed.
 *
 * TODO: Add support for UTF8 characters. This requires changes throughout
 * the stack and in particular encoding/decoding the shop name in URLs.
 *
 * @param {string} name
 * @returns {boolean}
 */
function isValidStoreName(name) {
  return Boolean(name.match(/^[a-zA-Z0-9-' ]+$/))
}

/**
 * Create a new shop in the DB.
 *
 * @param {number} networkId: 1=Mainnet, 4=Rinkeby, 999=localhost, etc...
 * @param {string} name: shop name
 * @param {string} listingId: listing ID associated with the shop
 * @param {string} authToken: token
 * @param {string} config: Shop's encrypted configuration
 * @param {number} sellerId: If of the row in the SellerShop table for the shop's owner
 * @param {string} hostname: hostname of the shop URL
 * @returns {Promise<{shop: models.Shop}|{error: string}>}
 */
async function createShopInDB({
  networkId,
  name,
  listingId,
  authToken,
  config,
  sellerId,
  hostname
}) {
  if (!name) {
    return { error: 'Provide a shop name' }
  }

  name = name.trim()
  if (!isValidStoreName(name)) {
    return {
      error:
        'The shop name contains invalid character. Only alphabetical characters, numbers, space, hyphen and apostrophe are allowed.'
    }
  }
  if (listingId && !String(listingId).match(/^[0-9]+-[0-9]+-[0-9]+$/)) {
    return {
      error: 'Listing ID must be of form xxx-xxx-xxx eg 1-001-123'
    }
  }
  if (listingId && !listingId.startsWith(networkId)) {
    return {
      error: `Listing ID ${listingId} is not on expected Network ID ${networkId}`
    }
  }
  if (!authToken) {
    return { error: 'Provide an auth token' }
  }
  if (!sellerId) {
    return { error: 'Provide a seller ID' }
  }

  const shop = await Shop.create({
    name,
    networkId,
    listingId,
    authToken,
    config,
    sellerId,
    hostname
  })

  // Record the admin activity.
  await AdminLog.create({
    action: AdminLogActions.ShopCreated,
    sellerId,
    shopId: shop.id,
    createdAt: Date.now()
  })

  return { shop }
}

/**
 * Creates a new shop.
 *
 * TODO: break this large method into smaller functions.
 *
 * @param {models.Seller} seller DB object
 * @param {string} name: Name of the store.
 * @param {string} dataDir: Seed data dir. This is usually set to the shop's name.
 * @param {string} sellerEmail: merchant's email.
 * @param {string} supportEmail: Optional. Shop's support email.
 * @param {string} web3Pk: Optional. Web3 private key for recording orders as offers on the marketplace.
 *   Only necessary when the system operates in on-chain mode.
 * @param {string} listingId: Optional. Marketplace listingId.
 *   Only necessary when the system operates in on-chain mode.
 * @param {string} printfulApi: Optional. Printful API key.
 * @param {string} shopType: Optional. The type of shop.
 *  The following types are supported:
 *    'empty': Default shop type. Used the empty template.
 *    'blank': No template used. Only creates populates the DB and not the data dir.
 *    'local-dir': Creates a new shop that uses the data dir from an already existing shop. For super-admin use only.
 *  The following types are not currently enabled (the BE supports them but the FE does not use them):
 *    'clone-ipfs': Creates a new shop and clones products data from a shop IPFS hash.
 *    'affiliate': Creates the shop using the affiliate template.
 *    'single-product': Creates the shop using the single-product template.
 *    'multi-product': Creates the shop using the multi-product template.
 *    'printful': Create a new shop and populate the products by syncing from printful.
 * @returns {Promise<{success: false, reason: string, field:string, message: string}|{success: true, slug: string}>}
 */
async function createShop({
  seller,
  name,
  dataDir,
  supportEmail,
  web3Pk,
  listingId,
  printfulApi,
  shopType
}) {
  log.debug('createShop called')
  shopType = shopType || 'empty'

  if (!isValidStoreName(name)) {
    return {
      success: false,
      reason: 'invalid',
      field: 'name',
      message: 'Invalid store name'
    }
  }

  if (!isValidDataDir(dataDir)) {
    return {
      success: false,
      reason: 'invalid',
      field: 'dataDir',
      message: 'Invalid dataDir'
    }
  }

  // Determine the data directory name to use, except in 'local-dir' mode
  // since in that case we point to the same data directory as the original store.
  dataDir = kebabCase(dataDir)
  if (shopType !== 'local-dir') {
    dataDir = await getDataDir(dataDir)
  }

  const OutputDir = `${DSHOP_CACHE}/${dataDir}`
  const hostname = dataDir

  const network = await Network.findOne({ where: { active: true } })
  const networkConfig = getConfig(network.config)
  const netAndVersion = `${network.networkId}-${network.marketplaceVersion}`

  // If a listingId specific to the shop was not passed
  // use by default the network's listingId.
  const shopListingId = listingId || network.listingId

  // Only relevant for on-chain mode. Checks the shop's listingId doesn't
  // conflict with a listingId from another shop.
  if (listingId) {
    const existingShopWithListing = await Shop.findOne({
      where: { listingId: listingId }
    })
    if (existingShopWithListing) {
      return {
        success: false,
        reason: 'invalid',
        field: 'listingId',
        message: 'Already exists'
      }
    }
    // Check the listingId has the expected network and marketplace version.
    if (listingId.indexOf(netAndVersion) !== 0) {
      return {
        success: false,
        reason: 'invalid',
        field: 'listingId',
        message: `Must start with ${netAndVersion}`
      }
    }
  }

  //
  // Generate the shop's config
  //

  // For 'local-dir' mode get the original's shop name from its config.json
  if (shopType === 'local-dir') {
    const existingData = fs
      .readFileSync(`${OutputDir}/data/config.json`)
      .toString()
    const json = JSON.parse(existingData)
    name = json.fullTitle || json.title
  }

  // Construct the shop's public and data URLs.
  const publicUrl = getPublicUrl(
    hostname,
    networkConfig.domain,
    networkConfig.backendUrl
  )
  const dataUrl = getDataUrl(
    hostname,
    dataDir,
    networkConfig.domain,
    networkConfig.backendUrl
  )

  // Get the default shop config at network level.
  let defaultShopConfig = {}
  if (networkConfig.defaultShopConfig) {
    try {
      defaultShopConfig = JSON.parse(networkConfig.defaultShopConfig)
    } catch (e) {
      log.error('Error parsing default shop config')
    }
  }

  // Generate a PGP key for the shop.
  const pgpKeys = await genPGP()

  // Generate the shop's config, seeding it with the default network shop config.
  const config = {
    ...defaultShopConfig,
    ...pgpKeys,
    dataUrl,
    hostname,
    publicUrl,
    printful: printfulApi,
    deliveryApi: printfulApi ? true : false,
    supportEmail: supportEmail || seller.email,
    emailSubject: `Your order from ${name}`
  }
  // If the network default config did not include a web3pk,
  // use the one provided by the merchant.
  if (web3Pk && !config.web3Pk) {
    config.web3Pk = isHexPrefixed(web3Pk) ? web3Pk : addHexPrefix(web3Pk)
  }

  //
  // Create the shop in the database.
  //
  const shopResponse = await createShopInDB({
    networkId: network.networkId,
    sellerId: seller.id,
    listingId: shopListingId,
    hostname,
    name,
    authToken: dataDir,
    config: setConfig(config)
  })

  if (!shopResponse.shop) {
    log.error(`Error creating shop: ${shopResponse.error}`)
    return {
      success: false,
      reason: 'database failure',
      field: 'listingId',
      message: shopResponse.error
    }
  }

  const shopId = shopResponse.shop.id
  log.info(`Created shop ${shopId} with name ${shopResponse.shop.name}`)

  // Give admin permission in the DB to the creator of the shop.
  const role = 'admin'
  await SellerShop.create({ sellerId: seller.id, shopId, role })
  log.info(`Added role OK`)

  // For shop of type blank and local-dir, we don't need to create
  // a data directory. We are done.
  if (shopType === 'blank' || shopType === 'local-dir') {
    return { success: true, slug: dataDir }
  }

  //
  // Create files in the data directory.
  //
  fs.mkdirSync(OutputDir, { recursive: true })
  log.info(`Outputting to ${OutputDir}`)

  // If the shop uses the printful template, sync the data from Printful
  // to generate products and collections.
  if (shopType === 'printful' && printfulApi) {
    // Should this be made async? Like just moving to the queue instead of blocking?
    await printfulSyncProcessor.processor({
      data: {
        OutputDir,
        apiKey: printfulApi
      },
      log: (data) => log.debug(data),
      progress: () => {}
    })
  }

  // If the shop uses a template that is currently supported,
  // clone the template files to the shop's data directory on disk.
  // Also read the template's config.json file which can specify
  // template specific configuration that override the base config.json.
  let templateShopJsonConfig = {}
  if (supportedTemplateTypes.indexOf(shopType) >= 0) {
    log.info(`Using shop template for shop type: ${shopType}`)

    const shopTpl = `${templatesDir}/${shopType}`
    const config = fs.readFileSync(`${shopTpl}/config.json`).toString()
    templateShopJsonConfig = JSON.parse(config)
    await new Promise((resolve, reject) => {
      execFile('cp', ['-r', shopTpl, `${OutputDir}/data`], (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      })
    })
  }

  //
  // Generate a config.json
  //
  const baseShopJsonConfig = configs.shopConfig

  // Use the generic shop json config as a base and adds to it the
  // template specific overrides. Also a few other fields.
  let shopJsonConfig = {
    ...baseShopJsonConfig,
    ...templateShopJsonConfig,
    title: name,
    fullTitle: name,
    backendAuthToken: dataDir,
    supportEmail,
    pgpPublicKey: pgpKeys.pgpPublicKey.replace(/\\r/g, '')
  }

  // Set the back-end URL.
  const netPath = `networks[${network.networkId}]`
  shopJsonConfig = set(
    shopJsonConfig,
    `${netPath}.backend`,
    networkConfig.backendUrl
  )

  // Set the marketplace listing Id. Use shop's listing Id if specified,
  // otherwise default to the network level listingId.
  shopJsonConfig = set(shopJsonConfig, `${netPath}.listingId`, shopListingId)

  // Write the shop's config.json file to the disk cache.
  const shopConfigPath = `${OutputDir}/data/config.json`
  fs.writeFileSync(shopConfigPath, JSON.stringify(shopJsonConfig, null, 2))

  //
  // Generate a shipping.json
  //
  const shippingContent = JSON.stringify(configs.shipping, null, 2)
  fs.writeFileSync(`${OutputDir}/data/shipping.json`, shippingContent)

  return { success: true, slug: dataDir }
}

module.exports = {
  createShop,
  createShopInDB
}
