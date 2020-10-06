const fs = require('fs')

const { Shop } = require('../models')
const { DSHOP_CACHE } = require('./const')

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
 * Checks a data dir is valid.
 * Only alphanumeric and hyphen characters are allowed.
 *
 * @param {string} dir
 * @returns {boolean}
 */
function isValidDataDir(dir) {
  return Boolean(dir.match(/^[a-zA-Z0-9-]+$/))
}

/**
 * Generates the name of the data directory to use for a new shop
 * Ensure there is no conflict with any existing shops by adding
 * a postfix if necessary.
 *
 * @param {string} dir: suggested data directory.
 */
async function getDataDir(dir) {
  let dataDir, basename, postfix

  // Check if the data dir passed as argument already includes a postfix.
  // If it does, extract the postfix number and increment it.
  const existingPostfix = dir.match(/^(.*)-([0-9]+)$/)
  if (existingPostfix && existingPostfix.length === 2) {
    basename = existingPostfix[1]
    postfix = Number(existingPostfix[2]) + 1
    dataDir = `${basename}-${postfix}`
  } else {
    basename = dir
    postfix = 0
    dataDir = dir
  }

  // If dataDir already exists, try dataDir-1, dataDir-2 etc until it works
  while (!(await _tryDataDir(dataDir))) {
    postfix++
    dataDir = `${basename}-${postfix}`
  }
  return dataDir
}

module.exports = {
  findShop,
  findShopByHostname,
  getShopDataUrl,
  getShopPublicUrl,
  getDataUrl,
  getPublicUrl,
  getDataDir,
  isValidDataDir
}
