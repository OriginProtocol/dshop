const chai = require('chai')
const expect = chai.expect

const { Order } = require('../models')
const { processDShopEvent, handleLog } = require('../utils/handleLog')
const { post } = require('../utils/_ipfs')

const {
  addData,
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey
} = require('./utils')

describe('Orders', () => {
  let shop, offerIpfsHash, data, offerId

  before(async () => {
    const network = await getOrCreateTestNetwork()

    // Use account 1 as the merchant's.
    const sellerWallet = getTestWallet(1)
    const sellerPk = sellerWallet.privateKey

    // Create the merchant's PGP key.
    const pgpPrivateKeyPass = 'password123'
    const key = await generatePgpKey('tester', pgpPrivateKeyPass)
    const pgpPublicKey = key.publicKeyArmored
    const pgpPrivateKey = key.privateKeyArmored

    shop = await createTestShop({
      network,
      sellerPk,
      pgpPrivateKeyPass,
      pgpPublicKey,
      pgpPrivateKey
    })

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
      ipfsApi: network.ipfsApi
    })

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
      encryptedData: hash,
      paymentCode: 'code123'
    }
    offerIpfsHash = await post(network.ipfsApi, offer, true)
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
      mockGetEventObj: () => event,
      mockUpsert: () => event
    })

    expect(order).to.be.undefined
  })

  it('It should ignore any non-Offer event on a dshop listing', async () => {
    // Create a fake ListingUpdated event for a listing that is for dshop
    const listingUpdatedSignature =
      '0x470503ad37642fff73a57bac35e69733b6b38281a893f39b50c285aad1f040e0'
    const event = {
      eventName: 'ListingUpdated',
      listingId: shop.listingId,
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
    offerId = Date.now() // Use timestamp in msec as a unique offer id.
    const fullOfferId = `${shop.listingId}-${offerId}`

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
    expect(order.shopId).to.equal(shop.id)
    expect(order.statusStr).to.equal('OfferCreated')
    expect(order.ipfsHash).to.equal(offerIpfsHash)
    expect(order.createdBlock).to.equal(1)
    expect(order.updatedBlock).to.equal(1)
    expect(order.paymentCode).to.equal('code123')
    expect(order.data).to.eql({
      ...data,
      ...{ offerId: fullOfferId, tx: event.transactionHash }
    })
  })

  it('It should update an order on an OfferAccepted event', async () => {
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
    const fullOfferId = `${shop.listingId}-${offerId}`
    const order = await Order.findOne({ where: { orderId: fullOfferId } })
    expect(order).to.be.an('object')
    expect(order.statusStr).to.equal('OfferAccepted')
    expect(order.updatedBlock).to.equal(2)
  })

  it('It should update an order on an OfferWithdrawn event', async () => {
    // Create a fake OfferWithdrawn blockchain event.
    const event = {
      eventName: 'OfferWithdrawn',
      offerId,
      party: '0xabcdef',
      ipfsHash: offerIpfsHash, // TODO: use a separate offer withdrawn IPFS blob.
      networkId: 999,
      transactionHash: '0x12AB',
      blockNumber: 3,
      timestamp: Date.now() / 1000
    }

    // Call the logic for processing the event.
    await processDShopEvent({ event, shop })

    // Check the order status and updateBlock were updated.
    const fullOfferId = `${shop.listingId}-${offerId}`
    const order = await Order.findOne({ where: { orderId: fullOfferId } })
    expect(order).to.be.an('object')
    expect(order.statusStr).to.equal('OfferWithdrawn')
    expect(order.updatedBlock).to.equal(3)
  })

  it('It should throw an exception in case of a failure to fetch the offer data from IPFS', async () => {
    // Create a fake OfferWithdrawn blockchain event.
    const event = {
      eventName: 'OfferCreated',
      offerId: Date.now(), // Use timestamp in msec as a unique offer id.
      party: '0xabcdef',
      ipfsHash: 'invalidHash',
      networkId: 999,
      transactionHash: '0x12ABED789',
      blockNumber: 4,
      timestamp: Date.now() / 1000
    }

    let failure = false
    try {
      await processDShopEvent({ event, shop })
    } catch (e) {
      failure = true
    }
    expect(failure).to.be.true
  })
})
