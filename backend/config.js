require('dotenv').config()

const fetch = require('node-fetch')
const memoize = require('lodash/memoize')
const { PROVIDER, NETWORK_ID } = require('./utils/const')
const { getLogger } = require('./utils/logger')

const log = getLogger('config')

const Defaults = {
  '999': {
    ipfsGateway: 'http://localhost:8080',
    ipfsApi: `http://localhost:${process.env.IPFS_API_PORT || 5002}`,
    provider: 'http://localhost:8545',
    providerWs: 'ws://localhost:8545',
    marketplaceContract: process.env.MARKETPLACE_CONTRACT
  },
  '4': {
    ipfsGateway: 'https://fs-autossl.staging.ogn.app',
    ipfsApi: 'https://fs.staging.ogn.app',
    marketplaceContract: '0x3d608cce08819351ada81fc1550841ebc10686fd',
    fetchPastLogs: true
  },
  '1': {
    ipfsGateway: 'https://fs-autossl.ogn.app',
    ipfsApi: 'https://fs.ogn.app',
    marketplaceContract: '0x698ff47b84837d3971118a369c570172ee7e54c2',
    fetchPastLogs: true
  }
}

const getSiteConfig = memoize(async function getSiteConfig(
  dataURL,
  netId = NETWORK_ID
) {
  let data
  if (dataURL) {
    const url = `${dataURL}config.json`
    log.debug(`Loading config from ${url}`)
    const dataRaw = await fetch(url)
    data = await dataRaw.json()
  } else {
    log.warn('dataURL not provided')
  }
  const defaultData = Defaults[netId] || {}
  const networkData = data ? data.networks[netId] : null || {}
  const siteConfig = {
    provider: PROVIDER,
    ...data,
    ...defaultData,
    ...networkData
  }
  return siteConfig
})

module.exports = {
  defaults: Defaults,
  getSiteConfig,
  provider: PROVIDER
}
