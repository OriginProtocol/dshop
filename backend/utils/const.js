const path = require('path')
require('dotenv').config()
const randomstring = require('randomstring')

// Note: Origin managed staging and prod kubernetes deployments do not
// use EnvKey. The required env vars are set in helm charts.
try {
  require('envkey')
} catch (err) {
  console.log('Is ENVKEY missing?')
}

const { TEST_DSHOP_CACHE, TEST_THEMES_CACHE } = require('../test/const')

const NETWORK_NAME_TO_ID = {
  localhost: 999,
  rinkeby: 4,
  mainnet: 1
}

const NETWORK_ID_TO_NAME = Object.keys(NETWORK_NAME_TO_ID).reduce(
  (acc, cur) => {
    acc[NETWORK_NAME_TO_ID[cur]] = cur
    return acc
  },
  {}
)

const CONTRACTS = {
  999: {
    marketplace: {
      '000': process.env.MARKETPLACE_CONTRACT,
      '001': process.env.MARKETPLACE_CONTRACT
    }
  },
  4: {
    marketplace: {
      '000': '0xe842831533c4bf4B0F71B4521C4320BDB669324E',
      '001': '0x3D608cCe08819351adA81fC1550841ebc10686fd'
    }
  },
  1: {
    marketplace: {
      '000': '0x819Bb9964B6eBF52361F1ae42CF4831B921510f9',
      '001': '0x698Ff47B84837d3971118a369c570172EE7e54c2'
    }
  }
}

const NODE_ENV = process.env.NODE_ENV
const IS_PROD = NODE_ENV === 'production'
const IS_TEST = NODE_ENV === 'test'
const IS_DEV = NODE_ENV === 'development' || (!IS_PROD && !IS_TEST)
const PROTOCOL_LABS_GATEWAY = 'https://gateway.ipfs.io'
const PINATA_API = 'https://api.pinata.cloud'
const PINATA_GATEWAY = 'https://gateway.pinata.cloud'
const DEFAULT_BUCKET_PREFIX = `ds-deploy-`
const DEFAULT_SERVICE_PREFIX = DEFAULT_BUCKET_PREFIX

const {
  SESSION_SECRET = randomstring.generate(),
  ENCRYPTION_KEY = IS_TEST ? 'abcdef' : undefined,
  NETWORK = IS_PROD ? 'rinkeby' : 'dev',
  WEB3_PK,
  PROVIDER,
  PROVIDER_WS,
  REDIS_URL,
  IPFS_GATEWAY, // IPFS gateway override
  BUCKET_PREFIX = DEFAULT_BUCKET_PREFIX,
  SERVICE_PREFIX = DEFAULT_SERVICE_PREFIX,
  EXTERNAL_IP,
  AWS_MARKETPLACE_DEPLOYMENT //bool indicating whether the app is running from an AWS EC2 instance launched via the marketplace
} = process.env

/**
 * This is a placeholder for possible future single-tenant override. Currently
 * it does nothing, so don't bother setting it.  Instead create a single store
 * config.
 */
const DATA_URL = null
const PRINTFUL_URL = 'https://api.printful.com'

// Service that returns a plaintext IP for a GET request
const EXTERNAL_IP_SERVICE_URL = 'https://api.ipify.org'

const DSHOP_CACHE = path.resolve(
  IS_TEST ? TEST_DSHOP_CACHE : process.env.DSHOP_CACHE || `${__dirname}/../data`
)

const THEMES_CACHE = IS_TEST
  ? TEST_THEMES_CACHE
  : process.env.THEMES_CACHE || `${__dirname}/../themes`

const DEFAULT_INFRA_RESOURCES = [
  'gcp-files',
  'gcp-dns',
  'ipfs-pinata',
  'gcp-cdn',
  'sendgrid-email'
]
const DEFAULT_AWS_REGION = 'us-east-1'
const DEFAULT_AWS_CACHE_POLICY_NAME = 'dshop-default-cache-policy'
const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

module.exports = {
  CONTRACTS,
  ENCRYPTION_KEY,
  DATA_URL,
  NODE_ENV,
  IS_PROD,
  IS_TEST,
  IS_DEV,
  SESSION_SECRET,
  WEB3_PK,
  PROVIDER_WS,
  PROVIDER,
  REDIS_URL,
  IPFS_GATEWAY,
  NETWORK,
  NETWORK_ID: NETWORK_NAME_TO_ID[NETWORK] || 999,
  NETWORK_NAME_TO_ID,
  NETWORK_ID_TO_NAME,
  PRINTFUL_URL,
  DSHOP_CACHE,
  THEMES_CACHE,
  PROTOCOL_LABS_GATEWAY,
  PINATA_API,
  PINATA_GATEWAY,
  BUCKET_PREFIX,
  SERVICE_PREFIX,
  EXTERNAL_IP,
  AWS_MARKETPLACE_DEPLOYMENT,
  EXTERNAL_IP_SERVICE_URL,
  DEFAULT_INFRA_RESOURCES,
  DEFAULT_AWS_REGION,
  DEFAULT_AWS_CACHE_POLICY_NAME,
  DEFAULT_CONTENT_TYPE
}
