require('dotenv').config()
const randomstring = require('randomstring')

// Note: Origin managed staging and prod kubernetes deployments do not
// use EnvKey. The required env vars are set in helm charts.
try {
  require('envkey')
} catch (err) {
  console.log('Is ENVKEY missing?')
}

const NETWORK_NAME_TO_ID = {
  localhost: 999,
  rinkeby: 4,
  mainnet: 1
}

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

const {
  SESSION_SECRET = randomstring.generate(),
  ENCRYPTION_KEY = IS_TEST ? 'abcdef' : undefined,
  NETWORK = IS_PROD ? 'rinkeby' : 'dev',
  WEB3_PK,
  PROVIDER,
  PROVIDER_WS,
  REDIS_URL,
  IPFS_GATEWAY, // IPFS gateway override
  SUPPORT_EMAIL_OVERRIDE
} = process.env

/**
 * This is a placeholder for possible future single-tenant override. Currently
 * it does nothing, so don't bother setting it.  Instead create a single store
 * config.
 */
const DATA_URL = null
const PRINTFUL_URL = 'https://api.printful.com'
const DSHOP_CACHE = process.env.DSHOP_CACHE || `${__dirname}/../data`

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
  SUPPORT_EMAIL_OVERRIDE,
  PRINTFUL_URL,
  DSHOP_CACHE
}
