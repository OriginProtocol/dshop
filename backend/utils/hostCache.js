/**
 * Singleton to keep track of hostname->auth_token for speedy lookups for static
 * assets.
 */

const { Network, Shop, ShopDomain } = require('../models')
const { getLogger } = require('../utils/logger')

const log = getLogger('utils.hostCache')
let lastLookupCleanup = 0
let lastLookup = {}
let nodeDomain = null
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
    log.debug(`Cache miss (${host})`)

    if (!nodeDomain) {
      const network = await Network.findOne({
        where: { active: true }
      })
      if (network && network.domain) {
        nodeDomain = network.domain
        log.debug(`Set nodeDomain: ${nodeDomain}`)
      }
    }

    if (!lastLookup[host] || now - lastLookup[host] > LOOKUP_LIMIT) {
      // First check if this is a default shop domain
      if (nodeDomain && host.endsWith(nodeDomain)) {
        const hostname = host.replace(`.${nodeDomain}`, '')

        const shop = await Shop.findOne({
          where: { hostname },
          include: 'shop'
        })

        if (shop) {
          log.debug(`${host} is ${shop.authToken}`)
          hostnames[host] = shop.authToken
        }
      }

      // We don't want to poke the DB too often for static file requests
      else {
        const shopDom = await ShopDomain.findOne({
          where: { domain: host },
          include: 'shop'
        })

        if (shopDom) {
          log.debug(`${host} is ${shopDom.shop.authToken}`)
          hostnames[host] = shopDom.shop.authToken
        }
      }

      lastLookup[host] = now
    }
  } else {
    log.debug(`Cache hit (${host})`)
  }

  return hostnames[host]
}

module.exports = hostCache
