const { Shop } = require('../models')

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
  if (!name.match(/^[0-9a-z ]+$/)) {
    return {
      status: 400,
      error:
        'Shop name contains non alphanumeric character. Please only use [a-zA-z0-9 ] characters.'
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
      error:
        'Listing ID ${listingId} is not on expected Network ID ${networkId}'
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

module.exports = { createShop, findShopByHostname }
