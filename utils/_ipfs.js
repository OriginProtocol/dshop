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

const { getShopConfigJson } = require('../config')
const { DATA_URL, IPFS_GATEWAY, IS_TEST } = require('./const')
const { TEST_IPFS_GATEWAY } = require('../test/const')

/**
 * Resolve an IPFS gateway from whatever's available.
 * Either a provided shop config or env vars.
 *
 * @param {string} dataUrl: URL to load config JSON from. Defaults to DATA_URL.
 * @returns {string} IPFS gateway URL
 */
async function resolveIPFSGateway(dataUrl, networkId) {
  if (IS_TEST) {
    return TEST_IPFS_GATEWAY
  }
  const url = dataUrl || DATA_URL
  if (url) {
    const conf = await getShopConfigJson(url, networkId)
    if (!conf) {
      throw new Error(`Failed shop config from ${url}`)
    }
    return conf.ipfsGateway
  } else if (IPFS_GATEWAY) {
    return IPFS_GATEWAY
  } else {
    throw new Error('Failed resolving IPFS Gateway')
  }
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
