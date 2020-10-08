const { getLogger } = require('../utils/logger')

const log = getLogger('utils.validators')

function assert(cond, message) {
  if (!cond) {
    throw new Error(`Assertion error: ${message}`)
  }
  return true
}

/**
 * Validate a Shop object for creating a new shop
 */
function validateShop(shop) {
  try {
    assert(typeof shop === 'object', 'Invalid shop object')
    assert(typeof shop.name === 'string', 'Shop name should be a string')
    assert(shop.name !== '', 'Shop name missing')
    assert(shop.listingId, 'Shop needs a listing ID')
    assert(shop.authToken, 'Shop needs an authentication token')
    assert(!shop.config, 'Shop configuration should not exist')
  } catch (err) {
    if (err.message.includes('Assertion')) {
      log.warn(err.message)
      return false
    }
    throw err
  }
  return true
}

module.exports = {
  assert,
  validateShop
}
