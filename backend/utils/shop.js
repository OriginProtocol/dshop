const fs = require('fs')

const { Shop } = require('../models')
const { DSHOP_CACHE } = require('./const')

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
 * @returns {Promise<{shop: models.Shop}|{error: string, status: number}>}
 */
async function createShop({
  networkId,
  name,
  listingId,
  authToken,
  config,
  sellerId,
  hostname
}) {
  if (!name) {
    return { status: 400, error: 'Provide a shop name' }
  }
  // Remove any leading/trailing space.
  name = name.trim()

  // Store name must only contain alpha-numeric characters and space.
  // TODO: Add support for UTF_8 characters. This requires changes throughout the stack
  //       and in particular encoding/decoding shop name in URLs.
  if (!name.match(/^[a-zA-Z0-9\-' ]+$/)) {
    return {
      status: 400,
      error:
        'The shop name contains invalid character. Only alphabetical characters, numbers, space, hyphen and apostrophe are allowed.'
    }
  }
  if (listingId && !String(listingId).match(/^[0-9]+-[0-9]+-[0-9]+$/)) {
    return {
      status: 400,
      error: 'Listing ID must be of form xxx-xxx-xxx eg 1-001-123'
    }
  }
  if (listingId && !listingId.startsWith(networkId)) {
    return {
      status: 400,
      error: `Listing ID ${listingId} is not on expected Network ID ${networkId}`
    }
  }
  if (!authToken) {
    return { status: 400, error: 'Provide an auth token' }
  }
  if (!sellerId) {
    return { status: 400, error: 'Provide a seller ID' }
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

  return { shop }
}

function findShopByHostname(req, res, next) {
  Shop.findOne({ where: { hostname: req.hostname } }).then((shop) => {
    req.shop = shop
    next()
  })
}

/**
 * Middleware to find a shop using `shopId` param
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const findShop = async (req, res, next) => {
  const { shopId } = req.params
  const shop = await Shop.findOne({ where: { id: shopId } })
  req.shop = shop
  next()
}

/**
 * Get a shop's public URL. To be used before a shop is created.
 * @param {string} hostname: Shop's hostname.
 * @param {string} domain: Network domain or localhost on dev environment.
 * @param {string} backendUrl: Url to the back-end. Only used in dev/test environment.
 * @returns {string}
 */
function getPublicUrl(hostname, domain, backendUrl) {
  const isLocal = domain === 'localhost'
  return isLocal ? backendUrl : `https://${hostname}.${domain}`
}

/**
 * Get a shop's data URL. To be used before a shop is created.
 * @param {string} hostname: Shop's hostname.
 * @param {string} dataDir: Name of the directory where the shop's data is stored.
 * @param {string} domain: Network domain or localhost on dev environment.
 * @param {string} backendUrl: Url to the back-end. Only used in dev/test environment.
 * @returns {string}
 */
function getDataUrl(hostname, dataDir, domain, backendUrl) {
  const publicUrl = getPublicUrl(hostname, domain, backendUrl)
  return `${publicUrl}/${dataDir}/`
}

/**
 * Get a shop's public URL.
 * @param {models.Shop} shop
 * @param {object} networkConfig: Network configuration.
 * @returns {string}
 */
function getShopPublicUrl(shop, networkConfig) {
  return getPublicUrl(
    shop.hostname,
    networkConfig.domain,
    networkConfig.backendUrl
  )
}

/**
 * Get a shop's data URL.
 * @param {models.Shop} shop
 * @param {object} networkConfig: Network configuration.
 * @returns {string}
 */
function getShopDataUrl(shop, networkConfig) {
  return getDataUrl(
    shop.hostname,
    shop.authToken,
    networkConfig.domain,
    networkConfig.backendUrl
  )
}


async function _tryDataDir(dataDir) {
  const hasDir = fs.existsSync(`${DSHOP_CACHE}/${dataDir}`)
  const [authToken, hostname] = [dataDir, dataDir]
  const existingShopWithAuthToken = await Shop.findOne({ where: { authToken } })
  const existingShopWithHostname = await Shop.findOne({ where: { hostname } })
  return !existingShopWithAuthToken && !hasDir && !existingShopWithHostname
}

/**
 * Generates the name of the data directory to use for a new shop
 * in the dshop cache on-disk. Ensure there is no conflict with any
 * existing shops by adding a postfix if necessary.
 *
 * @param {string} dir: suggested data directory.
 */
async function getDataDir(seedDataDir) {
  let dataDir, basename, postfix

  // Check if the data dir passed as argument already includes a postfix.
  // If it does, extract the postfix number and increment it.
  const existingPostfix = seedDataDir.match(/^(.*)-([0-9]+)$/)
  if (existingPostfix && existingPostfix.length === 2) {
    basename = existingPostfix[1]
    postfix = Number(existingPostfix[2]) + 1
  } else {
    basename = seedDataDir
    postfix = 0
  }

  // If dataDir already exists, try dataDir-1, dataDir-2 etc until it works
  while (!(await _tryDataDir(dataDir))) {
    postfix++
    dataDir = `${basename}-${postfix}`
  }
  return dataDir
}

module.exports = {
  createShop,
  findShop,
  findShopByHostname,
  getShopDataUrl,
  getShopPublicUrl,
  getDataUrl,
  getPublicUrl,
  getDataDir
}
