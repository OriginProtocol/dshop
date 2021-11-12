const fetch = require('node-fetch')
const { ethers } = require('ethers')
const openpgp = require('openpgp')
openpgp.config.show_comment = false
openpgp.config.show_version = false

const { ROOT_BACKEND_URL } = require('./const')
const { getBytes32FromIpfsHash, post: postIpfs } = require('../utils/_ipfs')

const { Network } = require('../models')
const { defaults } = require('../config')
const { createShopInDB } = require('../logic/shop/create')
const { setConfig, getConfig } = require('../utils/encryptedConfig')
const { createListing, baseListing } = require('../utils/createListing')
const { getLogger } = require('../utils/logger')

let _cookies = {}
const log = getLogger('test.utils')

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

async function post(url, body, opts, method = 'post') {
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
    method: method,
    body: JSON.stringify(body),
    headers
  })
  storeCookies(response)
  return await response.json()
}

async function apiRequest({ method, endpoint, body, headers }) {
  const url = `${ROOT_BACKEND_URL}${endpoint}`

  if (/^(post|put)$/i.test(method)) {
    return await post(url, body, { headers }, method)
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
async function getOrCreateTestNetwork(opts = {}) {
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
    marketplaceContract: ethers.utils.getAddress(config.marketplaceContract), // call getAddress to checksum the address.
    marketplaceVersion: '001',
    listingId: '999-001-1', // TODO: we may need to create a real listing on the marketplace contract.
    active: true,
    useMarketplace: opts.useMarketplace ? opts.useMarketplace : false,
    config: setConfig({
      pinataKey: 'pinataKey',
      pinataSecret: 'pinataSecret',
      cloudflareEmail: 'cloudflareEmail',
      cloudflareApiKey: 'cloudflareApiKey',
      gcpCredentials: 'gcpCredentials',
      domain: 'notarealdomainsayscthulhu.com',
      deployDir: 'deployDir',
      fallbackShopConfig: {},
      ...opts.configOverride
    })
  }
  // Note: For unclear reasons, the migration file 20200317190719-addIpfs.js
  // inserts a row for network 999. Therefore the update case below...
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
 * @param {string} pgpPublicKey
 * @param {string} pgpPrivateKey
 * @param {Boolean} inventory
 * @returns {Promise<*>}
 */
async function createTestShop({
  network,
  sellerPk,
  pgpPrivateKeyPass,
  pgpPublicKey,
  pgpPrivateKey,
  inventory
}) {
  // Create a listing on the blockchain for the shop.
  const listing = {
    ...baseListing,
    title: 'ListingA',
    shopIpfsHash: 'TestShopHash'
  }
  const listingId = await createListing({ network, pk: sellerPk, listing })
  log.info('Created listing ID', listingId)

  // Create the shop in the DB.
  const { shop } = await createShopInDB({
    name: 'TestShop' + Date.now(), // Make shop's name unique.
    networkId: network.networkId,
    listingId,
    sellerId: 1,
    authToken: 'shopAuthToken' + Date.now(), // Make the token unique.
    config: setConfig({
      dataUrl: undefined,
      publicUrl: undefined,
      printful: undefined,
      stripeBackend: undefined,
      stripeWebhookSecret: undefined,
      pgpPublicKey,
      pgpPrivateKey,
      pgpPrivateKeyPass,
      web3Pk: sellerPk,
      inventory
    })
  })
  if (!shop) {
    throw new Error('Failed creating test shop')
  }

  return shop
}

/**
 * Updates test shop's encrypted config
 * @param {models.Shop} shop
 * @param {Object} shopConfig
 * @returns {models.Shop}
 */
async function updateShopConfig(shop, shopConfig) {
  await shop.update({
    config: setConfig({
      ...getConfig(shop.config),
      ...shopConfig
    })
  })

  return shop
}

/**
 * Updates test shop's encrypted config
 * @param {models.Network} network
 * @param {Object} networkConfig
 * @returns {models.Network}
 */
async function updateNetworkConfig(network, networkConfig) {
  await network.update({
    config: setConfig({
      ...getConfig(network.config),
      ...networkConfig
    })
  })

  return network
}

/**
 * Creates encrypted data for an offer
 * @param {models.Network} network
 * @param {models.Shop} shop
 * @param {Object} key: seller's PGP key
 * @param {Object} opts: options
 *  - {models.Discount} discount: discount
 *  - {Object} paymentMethod: payment method override
 *  - {boolean} corruptPrice: whether or not to generate a cart with a corrupted item price
 * @returns {Promise<{data: *, ipfsHash: *}>}
 */
async function createTestEncryptedOfferData(network, shop, key, opts = {}) {
  const itemPrice = 2500
  const subTotalAmount = 2500
  const shippingAmount = 400

  // Calculate discount amount, if any.
  let discountAmount = 0
  if (opts.discount) {
    if (opts.discount.corruptTestData) {
      discountAmount = 9999
    } else if (['percentage', 'payment'].includes(opts.discount.discountType)) {
      const totalWithShipping =
        subTotalAmount + (opts.discount.excludeShipping ? 0 : shippingAmount)
      discountAmount = Math.round(
        (totalWithShipping * opts.discount.value) / 100
      )
    } else if (opts.discount.discountType === 'fixed') {
      discountAmount = opts.discount.value * 100
    } else {
      throw new Error(`Unexpected discount type: ${opts.discount.discountType}`)
    }
  }
  const totalAmount = Math.max(
    subTotalAmount + shippingAmount - discountAmount,
    0
  )

  const data = {
    items: [
      {
        product: 'iron-mask',
        quantity: 1,
        variant: 1234,
        price: opts.corruptPrice ? 99999 : itemPrice,
        externalProductId: 165524792,
        externalVariantId: 1811816649
      }
    ],
    instructions: '',
    subTotal: opts.corruptSubTotal ? 99999 : subTotalAmount,
    discount: discountAmount,
    donation: 0,
    total: totalAmount,
    currency: 'USD',
    shipping: {
      id: 'STANDARD',
      label: 'Flat Rate',
      amount: shippingAmount
    },
    paymentMethod: opts.paymentMethod || {
      id: 'stripe',
      label: 'Credit Card'
    },
    discountObj: opts.discount || {},
    userInfo: {
      firstName: 'The',
      lastName: 'Mandalorian',
      email: 'buyer@originprotocol.com',
      address1: '123 Main St',
      city: 'Palo Alto',
      province: 'California',
      country: 'United States',
      zip: '94301',
      billingCountry: 'United States'
    },
    dataKey: 'abbfs5a34o4j28arw21ynavek62y2km'
  }
  const { hash } = await addData(data, {
    pgpPublicKey: key.publicKeyArmored,
    ipfsApi: network.ipfsApi
  })

  return { ipfsHash: hash, data }
}

/**
 * Returns a shop's mock products.
 * @returns {Promise<void>}
 */
async function mockReadProductsFileFromWeb() {
  return [
    {
      id: 'iron-mask',
      externalId: 194464746,
      title: 'Mandalorian mask',
      price: 25000,
      image: '46c08ceaf67605b978f128b2b9153ac7.jpg'
    }
  ]
}

/**
 * Returns a mock product's data.
 * @returns {Promise<object>}
 */
async function mockReadProductDataFromWeb() {
  return {
    id: 'iron-mask',
    externalId: 194464746,
    title: 'Mandalorian mask',
    description: 'Put it on and never take it off.',
    price: 2000,
    available: true,
    options: ['Color', 'Size'],
    variants: [
      {
        id: 1234,
        externalId: 2157871598,
        title: 'Mandalorian mask - Gold / S',
        option1: 'Black',
        option2: 'S',
        option3: null,
        available: true,
        name: 'Mandalorian mask - Black / S',
        options: ['Gold', 'S'],
        price: 2500
      },
      {
        id: 9928,
        externalId: 2157871598,
        title: 'Mandalorian mask - Silver / M',
        option1: 'Black',
        option2: 'S',
        option3: null,
        available: true,
        name: 'Mandalorian mask - Silver / M',
        options: ['Silver', 'M'],
        price: 2500
      }
    ]
  }
}

/**
 * Creates a test offer.
 *
 * @param {models.Network} network
 * @param {models.Shop} shop
 * @param {object} key: seller's PGP key
 * @returns {Promise<{data: *, ipfsHash: *}>}
 */
async function createTestOffer(network, shop, key) {
  // Create an order data and store it encrypted on IPFS
  const { ipfsHash, data } = await createTestEncryptedOfferData(
    network,
    shop,
    key
  )

  // Create an offer on IPFS.
  const offer = {
    schemaId: 'https://schema.originprotocol.com/offer_2.0.0.json',
    listingId: shop.listingId,
    listingType: 'unit',
    unitsPurchased: 1,
    totalPrice: {
      amount: '25.00',
      currency: 'fiat-USD'
    },
    commission: {
      amount: '0.1',
      currency: 'OGN'
    },
    finalizes: 1209600,
    encryptedData: ipfsHash,
    paymentCode: 'code123'
  }
  const offerIpfsHash = await postIpfs(network.ipfsApi, offer, true)

  return { offer, ipfsHash: offerIpfsHash, data }
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
    this.queue = { name: 'testQueue' }
    this.log = log.info
    this.progress = (x) => log.info(`Queue progress: ${x}%`)
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
  createTestOffer,
  createTestEncryptedOfferData,
  mockReadProductsFileFromWeb,
  mockReadProductDataFromWeb,
  getTestWallet,
  getOrCreateTestNetwork,
  MockBullJob,
  updateShopConfig,
  updateNetworkConfig
}
