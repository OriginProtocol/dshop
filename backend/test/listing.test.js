const chai = require('chai')
const expect = chai.expect

const { Shop } = require('../models')
const { handleLog } = require('../utils/handleLog')
const { getTestWallet } = require('./utils')

describe('Listing', () => {
  let shop, sellerWallet
  const listingCreatedSignature =
    '0xec3d306143145322b45d2788d826e3b7b9ad062f16e1ec59a5eaba214f96ee3c'

  before(async () => {
    // Create a a shop associated with a seller wallet.
    sellerWallet = getTestWallet(1)
    shop = await Shop.create({
      name: 'TestShop' + Date.now(),
      networkId: 999,
      walletAddress: sellerWallet.address
    })
  })

  it('It should update the shop listingId', async () => {
    // Create a fake ListingCreated event.
    const event = {
      eventName: 'ListingCreated',
      listingId: 123,
      party: sellerWallet.address,
      ipfsHash: 'TESTHASH',
      networkId: 999,
      transactionHash: '0x12345',
      blockNumber: 1,
      timestamp: Date.now() / 1000
    }

    // Process the event. It should result in the shop's listingId to get updated.
    await handleLog({
      web3: null,
      networkId: '999',
      contractVersion: '001',
      data: null,
      topics: [listingCreatedSignature],
      transactionHash: '0x12345',
      blockNumber: 1,
      mockGetEventObj: () => event,
      mockUpsert: () => event
    })

    // Reload the shop and check its listingId
    await shop.reload()
    expect(shop.listingId).to.equal('999-001-123')
  })

  it('It should not update the shop listingId', async () => {
    // Create a fake ListingCreated event from the same account
    const event = {
      eventName: 'ListingCreated',
      listingId: 456,
      party: sellerWallet.address,
      ipfsHash: 'TESTHASH',
      networkId: 999,
      transactionHash: '0x12345',
      blockNumber: 1,
      timestamp: Date.now() / 1000
    }

    // Process the event. It should result in the shop's listingId to get updated.
    await handleLog({
      web3: null,
      networkId: '999',
      contractVersion: '001',
      data: null,
      topics: [listingCreatedSignature],
      transactionHash: '0x12345',
      blockNumber: 1,
      mockGetEventObj: () => event,
      mockUpsert: () => event
    })

    // Reload the shop and check its listingId hasn't changed.
    await shop.reload()
    expect(shop.listingId).to.equal('999-001-123')
  })

  it('It should update the most recent shop', async () => {
    // Reset the listingId of the old shop.
    await shop.update({ listingId: null })

    // Create a new shop for the same seller.
    const newShop = await Shop.create({
      name: 'NewTestShop' + Date.now(),
      networkId: 999,
      walletAddress: sellerWallet.address
    })

    // Create a fake ListingCreated event from the same account
    const event = {
      eventName: 'ListingCreated',
      listingId: 789,
      party: sellerWallet.address,
      ipfsHash: 'TESTHASH',
      networkId: 999,
      transactionHash: '0x12345',
      blockNumber: 1,
      timestamp: Date.now() / 1000
    }

    // Process the event. It should result in the new shop's listingId to get updated.
    await handleLog({
      web3: null,
      networkId: '999',
      contractVersion: '001',
      data: null,
      topics: [listingCreatedSignature],
      transactionHash: '0x12345',
      blockNumber: 1,
      mockGetEventObj: () => event,
      mockUpsert: () => event
    })

    // The old shop's listingId should still be null
    await shop.reload()
    expect(shop.listingId).to.be.null

    // The new shop's listingId should have been updated.
    await newShop.reload()
    expect(newShop.listingId).to.equal('999-001-789')
  })
})
