const {
  get,
  getText,
  post,
  postBinary,
  getBytes32FromIpfsHash,
  getIpfsHashFromBytes32,
  gatewayUrl
} = require('@origin/ipfs')
const { memoizePromise } = require('@origin/utils/memoize')

require('dotenv').config()

const config = require('../config')
const { DATA_URL, IPFS_GATEWAY, IS_TEST } = require('./const')
const { TEST_IPFS_GATEWAY } = require('../test/const')

/**
 * Resolve an IPFS gateway from whatever's available.  Either a provided config
 * or env vars.
 *
 * @param dataURL {string} - optional URL to load config JSON from
 * @returns {string} IPFS gateway URL
 */
async function resolveIPFSGateway(dataURL, networkId) {
  if (IS_TEST) {
    return TEST_IPFS_GATEWAY
  }
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

const getIPFSGateway = memoizePromise(resolveIPFSGateway)

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
