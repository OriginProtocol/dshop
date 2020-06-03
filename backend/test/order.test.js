const chai = require('chai')
const expect = chai.expect
const openpgp = require('openpgp')

const { Order, Network, Shop } = require('../models')
const { defaults } = require('../config')
const { processDShopEvent, handleLog } = require('../utils/handleLog')
const { post, getBytes32FromIpfsHash } = require('../utils/_ipfs')
const { createShop } = require('../utils/shop')
const { setConfig } = require('../utils/encryptedConfig')

openpgp.config.show_comment = false
openpgp.config.show_version = false

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

  const res = await post(
    ipfsApi,
    { data: encrypted.data, buyerData: buyerData.data },
    true
  )
  return { hash: res, auth: data.dataKey, bytes32: getBytes32FromIpfsHash(res) }
}

describe('Orders', () => {
  const listingId = '999-001-1'
  let offerIpfsHash, shopId, data, offerId

  before(async () => {
    const config = defaults['999']

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
    const existing = await Network.findOne({
      where: { networkId: networkObj.networkId }
    })
    if (existing) {
      await Network.update(networkObj, {
        where: { networkId: networkObj.networkId }
      })
    } else {
      await Network.create(networkObj)
    }

    // Create the merchant's PGP key.
    const pgpPrivateKeyPass = 'password123'
    const key = await generatePgpKey('tester', pgpPrivateKeyPass)
    const pgpPublicKey = key.publicKeyArmored
    const pgpPrivateKey = key.privateKeyArmored

    // Create a shop in the DB.
    const shopCreationResult = await createShop({
      name: 'TestShop',
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
        web3Pk: '0x123'
      })
    })
    if (!shopCreationResult || !shopCreationResult.shop) {
      throw new Error(`Failed creating shop: ${shopCreationResult}`)
    }
    shopId = shopCreationResult.shop.id

    // Create an order data and store it encrypted on IPFS
    data = {
      items: [
        {
          product: 'iron mask',
          quantity: 1,
          variant: 0,
          price: 2500,
          externalProductId: 165524792,
          externalVariantId: 1811816649
        }
      ],
      instructions: '',
      subTotal: 2500,
      discount: 0,
      donation: 0,
      total: 2500,
      shipping: {
        id: 'STANDARD',
        label: 'Flat Rate',
        amount: 399
      },
      paymentMethod: {
        id: 'stripe',
        label: 'Credit Card'
      },
      discountObj: {},
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
      ipfsApi: config.ipfsApi
    })

    // Create an offer on IPFS.
    const offer = {
      schemaId: 'https://schema.originprotocol.com/offer_2.0.0.json',
      listingId,
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
      encryptedData: hash
    }
    offerIpfsHash = await post(config.ipfsApi, offer, true)
  })

  it('It should ignore an OfferCreated event unrelated to dshop', async () => {
    // Create a fake OfferCreated event for a listing that is not dshop related.
    const offerCreatedSignature =
      '0x6ee68cb753f284cf771c1a32c236d7ffcab6011345186a30e57837d761e86837'
    const event = {
      eventName: 'OfferCreated',
      listingId: 2020,
      offerId: 1,
      party: '0xabcdef',
      ipfsHash: 'TESTHASH',
      networkId: 999,
      transactionHash: '0x12345',
      blockNumber: 1,
      timestamp: Date.now() / 1000
    }

    const order = await handleLog({
      web3: null,
      networkId: '999',
      contractVersion: '001',
      data: null,
      topics: [offerCreatedSignature],
      transactionHash: '0x12345',
      blockNumber: 1,
      mockGetEventObj: () => event
    })

    expect(order).to.be.undefined
  })

  it('It should ignore any non-Offer event on a dshop listing', async () => {
    // Create a fake ListingUpdated event for a listing that is for dshop
    const listingUpdatedSignature =
      '0x470503ad37642fff73a57bac35e69733b6b38281a893f39b50c285aad1f040e0'
    const event = {
      eventName: 'ListingUpdated',
      listingId: 1,
      offerId: 1,
      party: '0xabcdef',
      ipfsHash: 'TESTHASH',
      networkId: 999,
      transactionHash: '0x12345',
      blockNumber: 1,
      timestamp: Date.now() / 1000
    }

    const order = await handleLog({
      web3: null,
      networkId: '999',
      contractVersion: '001',
      data: null,
      topics: [listingUpdatedSignature],
      transactionHash: '0x12345',
      blockNumber: 1,
      mockGetEventObj: () => event,
      mockUpsert: () => event
    })

    expect(order).to.be.undefined
  })

  it('It should insert an order from an event', async () => {
    const shop = await Shop.findByPk(shopId)

    offerId = Math.round(Date.now() / 1000) // Use timestamp in second as a unique offer id.
    const fullOfferId = `${listingId}-${offerId}`

    // Create a fake OfferCreated blockchain event.
    const event = {
      eventName: 'OfferCreated',
      offerId,
      party: '0xabcdef',
      ipfsHash: offerIpfsHash,
      networkId: 999,
      transactionHash: '0x12345',
      blockNumber: 1,
      timestamp: Date.now() / 1000
    }

    // Call the logic for inserting an order in the DB based on a OfferCreated blockchain event.
    await processDShopEvent({ event, shop })

    // Check the order was inserted with the proper values.
    const order = await Order.findOne({ where: { orderId: fullOfferId } })
    expect(order).to.be.an('object')
    expect(order.networkId).to.equal(999)
    expect(order.shopId).to.equal(shopId)
    expect(order.statusStr).to.equal('OfferCreated')
    expect(order.ipfsHash).to.equal(offerIpfsHash)
    expect(order.createdBlock).to.equal(1)
    expect(order.updatedBlock).to.equal(1)
    expect(order.data).to.eql({
      ...data,
      ...{ offerId: fullOfferId, tx: event.transactionHash }
    })
  })

  it('It should update an order on an OfferAccepted event', async () => {
    const shop = await Shop.findByPk(shopId)

    // Create a fake OfferCreated blockchain event.
    const event = {
      eventName: 'OfferAccepted',
      offerId,
      party: '0xabcdef',
      ipfsHash: offerIpfsHash,
      networkId: 999,
      transactionHash: '0xABCD',
      blockNumber: 2,
      timestamp: Date.now() / 1000
    }

    // Call the logic for processing the event.
    await processDShopEvent({ event, shop })

    // Check the order status and updateBlock were updated.
    const fullOfferId = `${listingId}-${offerId}`
    const order = await Order.findOne({ where: { orderId: fullOfferId } })
    expect(order).to.be.an('object')
    expect(order.statusStr).to.equal('OfferAccepted')
    expect(order.updatedBlock).to.equal(2)
  })
})
