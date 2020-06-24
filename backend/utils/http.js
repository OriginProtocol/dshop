const https = require('https')

const { getLogger } = require('../utils/logger')

const log = getLogger('utils.http')

/**
 * Make a simple HTTPS GET request without caring about HTTP status codes.
 * Should error only on connection errors.
 *
 * @param opts {object} Object to be gien to https.get as a request
 */
async function getHTTPS(opts) {
  log.debug(`getHTTPS(${opts.servername}:${opts.port}${opts.path})`)
  return await new Promise((resolve, reject) => {
    https
      .get(opts, (response) => {
        log.debug(`HTTPS GET returned ${response.statusCode}`)
        resolve()
      })
      .on('error', (err) => {
        console.trace(err)
        log.error(`Error GETting ${opts.servername}${opts.path}`)
        reject(err)
      })
  })
}

module.exports = { getHTTPS }
