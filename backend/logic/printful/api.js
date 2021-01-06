const netFetch = require('node-fetch')
const crypto = require('crypto')

const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.printful.api')
const PrintfulURL = 'https://api.printful.com'

const Bottleneck = require('bottleneck')

const rateLimiters = new Map()

/**
 * Returns the rate-limiter of a printful shop
 * @param {String} apiKey API key of the printful shop
 */
const getLimiter = (apiKey) => {
  // Hash the apiKey so that the sensitive data
  // doesn't live in memory
  const key = crypto.createHash('md5').update(apiKey).digest('hex')

  if (rateLimiters.has(key)) {
    return rateLimiters.get(key)
  }

  // Printful has a rate limit of 120 per minute
  const limiter = new Bottleneck({
    reservoirIncreaseInterval: 60 * 1000, // 1m
    reservoirIncreaseAmount: 120,
    reservoirIncreaseMaximum: 120
  })

  rateLimiters.set(key, limiter)

  return limiter
}

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
async function fetch({ apiKey, auth, path, method, body }) {
  if (!apiKey && !auth) {
    throw new Error('Missing Printful API key')
  }

  const apiAuth = auth ? auth : Buffer.from(apiKey).toString('base64')
  const url = PrintfulURL + path

  const limiter = getLimiter(apiAuth)

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

  log.debug(`Calling Printful API ${method} ${url}`)
  return limiter.schedule(() => netFetch(url, opts))
}

async function post(path, { auth, body }) {
  const res = await fetch({
    path,
    auth,
    body,
    method: 'POST'
  })

  if (!res.ok) {
    log.error('Printful API error', path)
    // TODO: Should we throw here?
  }

  return await res.json()
}

async function get(path, { auth, apiKey }) {
  const res = await fetch({
    path,
    auth,
    apiKey,
    method: 'GET'
  })

  if (!res.ok) {
    log.error('Printful API error', path)
    // TODO: Should we throw here?
  }

  return await res.json()
}

module.exports = { post, get, fetch }
