const { getHTTPS } = require('./http')
const { getLogger } = require('../utils/logger')

const AUTOSSL_MAX_ATTEMPTS = 5
const AUTOSSL_BACKOFF = 30000

const log = getLogger('utils.autossl')

/**
 * Trigger AutoSSL to generate cert
 *
 * @param url {T} URL object or string to connect to
 * @returns {boolean} if it was successful
 */
async function triggerAutoSSL(url, autoSSLHost) {
  let success = false
  let attempts = 1

  url = url instanceof URL ? url : new URL(url)
  const hostname = url.hostname
  url.hostname = autoSSLHost.includes('//')
    ? autoSSLHost.split('//').slice(-1)
    : autoSSLHost

  log.debug(`Making request to ${url.hostname} with header (Host: ${hostname})`)

  for (;;) {
    try {
      await getHTTPS({
        host: url.hostname,
        path: url.pathname,
        port: url.port || 443,
        servername: hostname,
        headers: {
          host: hostname
        }
      })
      success = true
      break
    } catch (err) {
      log.info(
        `Unable to trigger AutoSSL on attempt ${attempts}:`,
        err.toString()
      )

      if (attempts <= AUTOSSL_MAX_ATTEMPTS) {
        // sleep with backoff
        await (async () => {
          log.debug(
            `AutoSSL trigger backing off by ${attempts * AUTOSSL_BACKOFF}ms`
          )
          return new Promise((resolve) =>
            setTimeout(resolve, attempts * AUTOSSL_BACKOFF)
          )
        })()

        attempts += 1
      } else {
        break
      }
    }
  }

  log.debug(`AutoSSL trigger ${success ? 'completed' : 'failed'}`)

  return success
}

module.exports = { triggerAutoSSL }
