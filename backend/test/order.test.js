const chai = require('chai')
const expect = chai.expect

const { OrderPaymentStatuses } = require('../enums')
const { Order } = require('../models')
const { processDShopEvent, handleLog } = require('../utils/handleLog')

const {
  getTestWallet,
  createTestShop,
  createTestOffer,
  getOrCreateTestNetwork,
  generatePgpKey
} = require('./utils')

describe('Orders', () => {
  let shop, offer, offerIpfsHash, data, offerId

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

    // Create an an offer.
    const result = await createTestOffer(network, shop, key)
    offer = result.offer
    offerIpfsHash = result.ipfsHash
    data = result.data
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
    const fqOfferId = `${shop.listingId}-${offerId}`

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
    const order = await Order.findOne({ where: { offerId: fqOfferId } })
    expect(order).to.be.an('object')
    expect(order.fqId).to.be.a('string')
    expect(order.shortId).to.be.a('string')
    expect(order.networkId).to.equal(999)
    expect(order.shopId).to.equal(shop.id)
    expect(order.paymentStatus).to.equal(OrderPaymentStatuses.Paid)
    expect(order.offerId).to.equal(fqOfferId)
    expect(order.offerStatus).to.equal('OfferCreated')
    expect(order.ipfsHash).to.equal(offerIpfsHash)
    expect(order.encryptedIpfsHash).to.equal(offer.encryptedData)
    expect(order.createdBlock).to.equal(1)
    expect(order.updatedBlock).to.equal(1)
    expect(order.paymentCode).to.equal('code123')
    expect(order.total).to.equal('2500')
    expect(order.currency).to.equal('USD')
    expect(order.data).to.eql({ ...data, tx: event.transactionHash })
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
    const fqOfferId = `${shop.listingId}-${offerId}`
    const order = await Order.findOne({ where: { offerId: fqOfferId } })
    expect(order).to.be.an('object')
    expect(order.paymentStatus).to.equal(OrderPaymentStatuses.Paid)
    expect(order.offerStatus).to.equal('OfferAccepted')
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
    const fqOfferId = `${shop.listingId}-${offerId}`
    const order = await Order.findOne({ where: { offerId: fqOfferId } })
    expect(order).to.be.an('object')
    expect(order.paymentStatus).to.equal(OrderPaymentStatuses.Refunded)
    expect(order.offerStatus).to.equal('OfferWithdrawn')
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
