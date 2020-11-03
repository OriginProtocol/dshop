/**
 * IP address utilities
 */
const fetch = require('node-fetch')
const { getLogger } = require('./logger')
const { IS_DEV, EXTERNAL_IP, EXTERNAL_IP_SERVICE_URL } = require('./const')

const log = getLogger('utils.ip')

/**
 * Return our external IP address
 *
 * @returns {string} IP address
 */
async function getMyIP() {
  if (typeof EXTERNAL_IP !== 'undefined') {
    log.debug(`Using preconfigured IP address for shop host (${EXTERNAL_IP})`)
    return EXTERNAL_IP
  }

  if (IS_DEV) {
    log.debug('Using local IP (127.0.0.1)')
    return '127.0.0.1'
  }

  log.debug('Figuring out external IP address for system...')

  return await resolveIP()
}

/**
 * Resolve our external IP using an external service
 *
 * @returns {string} IP address
 */
async function resolveIP() {
  const res = await fetch(EXTERNAL_IP_SERVICE_URL)
  return await res.text()
}

module.exports = {
  getMyIP
}
