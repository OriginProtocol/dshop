// Integration with Printful API.
// See doc at https://www.printful.com/docs
const netFetch = require('node-fetch')

const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.printful.api')
const printfulURL = 'https://api.printful.com'

/**
 * Makes an API call to printful.
 *
 * @param {string} apiKey: The Printful API key.
 * @param {string} path: Absolute path to the API to call. Fro ex. "/webhooks"
 * @param {string} method: HTTP method: GET/POST/PUT/DELETE
 * @param {object} body: Optional. Data to send in the body of the request.
 * @returns {Promise<*>}
 * @throws
 */
async function fetch(apiKey, path, method, body = null) {
  if (!apiKey) {
    throw new Error('Missing Printful API key')
  }

  const apiAuth = Buffer.from(apiKey).toString('base64')
  const url = printfulURL + path

  const opts = {
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${apiAuth}`
    },
    credentials: 'include',
    method
  }
  if (body) {
    opts.body = JSON.stringify(body)
  }

  log.debug('Calling Printful API', url)
  return netFetch(url, opts)
}

module.exports = {
  fetch
}
