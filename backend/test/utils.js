const fetch = require('node-fetch')
const ethers = require('ethers')
const openpgp = require('openpgp')
openpgp.config.show_comment = false
openpgp.config.show_version = false

const { ROOT_BACKEND_URL } = require('./const')
const { getBytes32FromIpfsHash, post: postIpfs } = require('../utils/_ipfs')

const { Network } = require('../models')
const { defaults } = require('../config')
const { createShop } = require('../utils/shop')
const { setConfig } = require('../utils/encryptedConfig')
const { createListing, baseListing } = require('../utils/createListing')

let _cookies = {}

function clearCookies() {
  _cookies = {}
}

function parseCookie(cstr) {
  const data = cstr.split(';').map((part) => part.trim())[0]
  return data.split('=')
}

function storeCookies(response) {
  const cookies = response.headers.raw()['set-cookie']

  if (!cookies) {
    return
  }

  for (const cookie of cookies) {
    const [key, val] = parseCookie(cookie)
    _cookies[key] = val
  }
}

function setCookies() {
  return Object.keys(_cookies)
    .map((key) => `${key}=${_cookies[key]}`)
    .join(';')
}

async function get(url, opts) {
  const headers = { cookie: setCookies() }

  if (opts && typeof opts.headers === 'object') {
    Object.keys(opts.headers).map((key) => {
      headers[key] = opts.headers[key]
    })
  }

  const response = await fetch(url, { headers })
  storeCookies(response)
  return await response.json()
}

async function post(url, body, opts) {
  const cookieHeader = setCookies()
  const headers = {
    'Content-Type': 'application/json',
    cookie: cookieHeader
  }

  if (opts && typeof opts.headers === 'object') {
    Object.keys(opts.headers).map((key) => {
      headers[key] = opts.headers[key]
    })
  }

  const response = await fetch(url, {
    method: 'post',
    body: JSON.stringify(body),
    headers
  })
  storeCookies(response)
  return await response.json()
}

async function apiRequest({ method, endpoint, body, headers }) {
  const url = `${ROOT_BACKEND_URL}${endpoint}`

  if (method === 'POST') {
    return await post(url, body, { headers })
  }

  if (body) {
    throw new Error('GET request cannot have a body')
  }

  return await get(url, { headers })
}

/**
 * Utility method to generate a PGP key.
 *
 * @param {string} name
 * @param {string} passphrase
 * @returns {Promise<{publicKeyArmored: string, privateKeyArmored: string}>}
 */
async function generatePgpKey(name, passphrase) {
  const key = await openpgp.generateKey({
    userIds: [{ name, email: `${name}@test.com` }],
    curve: 'ed25519',
    passphrase
  })
  return key
}

/**
 * Utility function copied from shop/src/data/addData.js
 * TODO: refactor into a common package.
 *
 * @param {Object} data
 * @param {string} pgpPublicKey
 * @param {string} ipfsApi
 * @returns {Promise<{auth: string, bytes32: string, hash: string}>}
 */
async function addData(data, { pgpPublicKey, ipfsApi }) {
  const pubKeyObj = await openpgp.key.readArmored(pgpPublicKey)

  data.dataKey = 'testDataKey'

  const buyerData = await openpgp.encrypt({
    message: openpgp.message.fromText(JSON.stringify(data)),
    passwords: [data.dataKey]
  })

  const encrypted = await openpgp.encrypt({
    message: openpgp.message.fromText(JSON.stringify(data)),
    publicKeys: pubKeyObj.keys
  })

  const res = await postIpfs(
    ipfsApi,
    { data: encrypted.data, buyerData: buyerData.data },
    true
  )
  return { hash: res, auth: data.dataKey, bytes32: getBytes32FromIpfsHash(res) }
}

/**
 * Creates or return existing network model
 * @returns {Promise<models.Network>}
 */
async function getOrCreateTestNetwork() {
  const config = defaults['999']

  // The default config relies on env variable MARKETPLACE_CONTRACT for
  // getting the marketplace contract address. If it is not set,
  // load up the address from the contracts build directory where addresses
  // are written after running truffle's contract deployments.
  if (!config.marketplaceContract) {
    let marketplaceContractAddress
    try {
      const contracts = require('../../packages/contracts/build/contracts.json')
      marketplaceContractAddress = contracts.Marketplace_V01
    } catch (e) {
      throw new Error(`Contracts not deployed on local blockchain: ${e}`)
    }
    config.marketplaceContract = marketplaceContractAddress
  }

  // Create a network row in the DB if it does not already exist.
  const networkObj = {
    networkId: 999,
    provider: config.provider,
    providerWs: config.providerWs,
    ipfs: config.ipfsGateway,
    ipfsApi: config.ipfsApi,
    marketplaceContract: config.marketplaceContract,
    marketplaceVersion: '001',
    active: true,
    config: setConfig({
      pinataKey: 'pinataKey',
      pinataSecret: 'pinataSecret',
      cloudflareEmail: 'cloudflareEmail',
      cloudflareApiKey: 'cloudflareApiKey',
      gcpCredentials: 'gcpCredentials',
      domain: 'domain.com',
      deployDir: 'deployDir'
    })
  }
  let network = await Network.findOne({
    where: { networkId: networkObj.networkId }
  })
  if (network) {
    await network.update(networkObj)
  } else {
    network = await Network.create(networkObj)
  }
  return network
}

/**
 * Creates a new shop in the DB.
 * @param {models.Network} network
 * @param {string} sellerPk
 * @param {string} pgpPrivateKeyPass
 * @param {string}pgpPublicKey
 * @param {string}pgpPrivateKey
 * @returns {Promise<*>}
 */
async function createTestShop({
  network,
  sellerPk,
  pgpPrivateKeyPass,
  pgpPublicKey,
  pgpPrivateKey
}) {
  // Create a listing on the blockchain for the shop.
  const listing = {
    ...baseListing,
    title: 'ListingA',
    shopIpfsHash: 'TestShopHash'
  }
  const listingId = await createListing({ network, pk: sellerPk, listing })
  console.log('Created listing ID', listingId)

  // Create the shop in the DB.
  const { shop } = await createShop({
    name: 'TestShop' + Date.now(), // Make shop's name unique.
    networkId: network.networkId,
    listingId,
    sellerId: 1,
    authToken: 'testToken',
    config: setConfig({
      dataUrl: undefined,
      publicUrl: undefined,
      printful: undefined,
      stripeBackend: undefined,
      stripeWebhookSecret: undefined,
      pgpPublicKey,
      pgpPrivateKey,
      pgpPrivateKeyPass,
      web3Pk: sellerPk
    })
  })
  if (!shop) {
    throw new Error('Failed creating test shop')
  }

  return shop
}

/**
 * Returns test wallets provisioned by ganache and that have ETH.
 * @param {number} index
 * @returns {Wallet}
 */
function getTestWallet(index) {
  // Default mnemonic and derivation path for ganache.
  const mnemonic =
    'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
  const path = "m/44'/60'/0'/0"

  // Get a node and derive it to get a pk.
  const node = ethers.utils.HDNode.fromMnemonic(mnemonic)
  const pk = node.derivePath(`${path}/${index}`).privateKey

  // Create a wallet based on the pk.
  return new ethers.Wallet(pk)
}

/**
 * Simple mock class for a Bull job.
 */
class MockBullJob {
  constructor(data) {
    this.id = Date.now() // unique and monotonically increasing job id.
    this.data = data
    this.log = console.log
    this.progress = (x) => console.log(`Queue progress: ${x}%`)
  }
}

module.exports = {
  clearCookies,
  get,
  post,
  apiRequest,
  generatePgpKey,
  addData,
  createTestShop,
  getTestWallet,
  getOrCreateTestNetwork,
  MockBullJob
}
