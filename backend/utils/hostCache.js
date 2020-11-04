/**
 * Singleton to keep track of hostname->auth_token for speedy lookups for static
 * assets.
 */

const { ShopDomain } = require('../models')
const { getLogger } = require('../utils/logger')

const log = getLogger('utils.hostCache')
let lastLookupCleanup = 0
let lastLookup = {}
const hostnames = {}

const LOOKUP_LIMIT = 3000 // 3 seconds
const LOOKUP_CLEANUP_INTERVAL = 900000 // 15 minutes

/**
 * Resolve a hostname to a shop's auth_token
 *
 * @param host {string} Value from a Host header
 * @returns {string} auth_token if found
 */
async function hostCache(host) {
  if (!host) return

  const now = +new Date()

  // Do not infinitely grow lookup
  if (now - lastLookupCleanup > LOOKUP_CLEANUP_INTERVAL) {
    lastLookup = {}
    lastLookupCleanup = now
  }

  if (typeof hostnames[host] === 'undefined') {
    log.debug('Cache miss')

    // We don't want to poke the DB too often for static file requests
    if (!lastLookup[host] || now - lastLookup[host] > LOOKUP_LIMIT) {
      const shopDom = await ShopDomain.findOne({
        where: { domain: host },
        include: 'shop'
      })

      if (shopDom) {
        hostnames[host] = shopDom.shop.authToken
      }

      lastLookup[host] = now
    }
  } else {
    log.debug('Cache hit')
  }

  return hostnames[host]
}

module.exports = hostCache
