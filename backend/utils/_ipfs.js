const bs58 = require('bs58')
const FormData = require('form-data')
const fetch = require('node-fetch')
const memoize = require('lodash/memoize')

require('dotenv').config()
const config = require('../config')
const { getLogger } = require('../utils/logger')

const { DATA_URL, IPFS_GATEWAY } = require('./const')

const log = getLogger('utils.handleLog')

/**
 * Resolve an IPFS gateway from whatever's available.  Either a provided config
 * or env vars.
 *
 * @param dataURL {string} - optional URL to load config JSON from
 * @returns {string} IPFS gateway URL
 */
async function resolveIPFSGateway(dataURL, networkId) {
  if (typeof DATA_URL !== 'undefined' || typeof dataURL !== 'undefined') {
    const conf = await config.getSiteConfig(DATA_URL || dataURL, networkId)
    if (!conf) {
      // TODO: Use a fallback/default?
      throw new Error('Unable to fetch config')
    }
    return conf.ipfsGateway
  }
  if (typeof IPFS_GATEWAY === 'undefined') {
    throw new Error('DATA_URL or IPFS_GATEWAY needs to be defined')
  }
  return IPFS_GATEWAY
}
const getIPFSGateway = memoize(resolveIPFSGateway)

function getBytes32FromIpfsHash(hash) {
  return `0x${bs58.decode(hash).slice(2).toString('hex')}`
}

/**
 * Returns base58 encoded ipfs hash from bytes32 hex string.
 * Ex.: "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231"
 *      ->"QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL"
 *
 * @param {string} bytes32Hex
 * @returns {string}
 */
function getIpfsHashFromBytes32(bytes32Hex) {
  // Add our default ipfs values for first 2 bytes:
  // function:0x12=sha2, size:0x20=256 bits
  // and cut off leading "0x"
  const hashHex = '1220' + bytes32Hex.slice(2)
  const hashBytes = Buffer.from(hashHex, 'hex')
  const hashStr = bs58.encode(hashBytes)
  return hashStr
}

/**
 * Takes an IPFS hash url (for example: ipfs://QmUwefhweuf...12322a) and
 * returns a url to that resource on the gateway.
 * Ensures that the IPFS hash does not contain anything evil and is the correct length.
 *
 * @param {string} gateway
 * @param {string} ipfsUrl
 * @returns {string}
 */
function gatewayUrl(gateway, ipfsUrl) {
  if (!ipfsUrl) {
    return
  }
  const match = ipfsUrl.match(/^ipfs:\/\/([A-Za-z0-9]{46})$/)
  if (match) {
    return `${gateway}/ipfs/${match[1]}`
  }
}

/**
 * Stores a JSON object as a text in IPFS.
 *
 * @param {string} gateway: URL of the IPFS gateway to use for the upload.
 * @param {object} json: JSON object to upload.
 * @param {boolean} rawHash: whether to return the hash in its raw format or as bytes32
 * @returns {Promise<string>}
 */
async function post(gateway, json, rawHash) {
  const formData = new FormData()
  let file
  if (typeof Blob === 'undefined') {
    file = Buffer.from(JSON.stringify(json))
  } else {
    file = new Blob([JSON.stringify(json)])
  }
  formData.append('file', file)

  const rawRes = await fetch(`${gateway}/api/v0/add`, {
    method: 'POST',
    body: formData
  })
  const res = await rawRes.json()
  if (rawHash) {
    return res.Hash
  } else {
    return getBytes32FromIpfsHash(res.Hash)
  }
}

/**
 * Posts binary data to IPFS and returns the base 58 encoded hash.
 *
 * @param {string} gateway: URL of the IPFS gateway to use.
 * @param {Buffer} buffer: binary data to upload.
 * @returns {Promise<{string}>}
 * @throws
 */
async function postBinary(gateway, buffer) {
  const formData = new FormData()
  formData.append('file', buffer)
  const rawRes = await fetch(`${gateway}/api/v0/add`, {
    method: 'POST',
    body: formData
  })
  const res = await rawRes.json()
  return res.Hash
}

/**
 * Fetches content from IPFS and returns it as a string.
 *
 * @param {string} gateway: URL of the IPFS gateway to use.
 * @param {string} hashAsBytes: IPFS hash.
 * @param {number} timeoutMS: Timeout in msec.
 * @returns {Promise<string>}
 * @throws
 */
async function getTextFn(gateway, hashAsBytes, timeoutMS) {
  const hash =
    hashAsBytes.indexOf('0x') === 0
      ? getIpfsHashFromBytes32(hashAsBytes)
      : hashAsBytes
  const response = await new Promise((resolve, reject) => {
    let didTimeOut = false
    const timeout = setTimeout(() => {
      didTimeOut = true
      reject(new Error('IPFS gateway timeout'))
    }, timeoutMS)
    fetch(`${gateway}/ipfs/${hash}`)
      .then((response) => {
        clearTimeout(timeout)
        if (!didTimeOut) {
          resolve(response)
        }
      })
      .catch((error) => {
        clearTimeout(timeout)
        if (!didTimeOut) {
          reject(error)
        }
      })
    if (didTimeOut) log.warn(`Timeout when fetching ${hash}`)
  })
  if (!response) {
    return '{}'
  }
  return await response.text()
}

/**
 * Utility method to use as a wrapper for for memoize when used with async function.
 * Prevents memoize from caching the result in case the function threw an exception.
 *
 * @param {function} f: the function to call and cache result for
 * @param {function} resolver: function to get the cache key to use
 * @returns {function}
 */
function memoizePromise(f, resolver = (k) => k) {
  const memorizedFunction = memoize(async function (...args) {
    try {
      return await f(...args)
    } catch (e) {
      // Function threw an exception. Do not cache the result.
      memorizedFunction.cache.delete(resolver(...args))
      throw e
    }
  }, resolver)
  return memorizedFunction
}

// Memoized version of getTextFn
const getText = memoizePromise(getTextFn, (...args) => args[1])

/**
 * Fetches content from IPFS and returns it as a JSON object.
 *
 * @param {string} gateway: URL of the IPFS gateway to use.
 * @param {string} hashAsBytes: IPFS hash.
 * @param {number} timeoutMS: Timeout in msec.
 * @returns {Promise<object>}
 * @throws
 */
async function get(gateway, hashAsBytes, timeoutMS = 10000) {
  if (!hashAsBytes) return null

  const text = await getText(gateway, hashAsBytes, timeoutMS)

  return JSON.parse(text)
}

module.exports = {
  get,
  getText,
  post,
  postBinary,
  getBytes32FromIpfsHash,
  getIpfsHashFromBytes32,
  gatewayUrl,
  getIPFSGateway
}
