const { Shop } = require('../models')

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
  if (listingId && !String(listingId).match(/^[0-9]+-[0-9]+-[0-9]+$/)) {
    return {
      status: 400,
      error: 'Listing ID must be of form xxx-xxx-xxx eg 1-001-123'
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
