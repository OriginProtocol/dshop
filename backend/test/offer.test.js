const chai = require('chai')
const expect = chai.expect

const { createTestShop } = require('./utils')
const { processor } = require('../queues/makeOfferProcessor')
const { Transaction } = require('../models')
const { TransactionTypes, TransactionStatuses } = require('../enums')
const { ListingID, OfferID } = require('../utils/id')

describe('Offers', () => {
  let shop

  before(async () => {
    shop = await createTestShop()
  })

  it('It should make an offer', async () => {
    // Create a Bull job object.
    const job = {
      jobId: Date.now(), // unique job id.
      shopID: shop.id,
      amount: '100',
      encryptedData: 'IpfsHashOfEncryptedOfferData', // TODO
      paymentCode: 'testPaymentCode' + Date.now()
    }

    // Call the processor to record the offer on the blockchain.
    const { receipt, listingId, offerId, ipfsHash } = await processor(job)

    const lid = new ListingID(listingId, 999)
    const oid = new OfferID(listingId, offerId, 999)
    expect(shop.listingId).to.equal(lid.toString())
    expect(oid.toString()).to.startsWith(lid.toString())

    // A transaction row should have been created.
    const t = await Transaction.findOne({ where: { jobId: job.jobId } })
    expect(t).to.be.defined
    expect(t.shopId).to.be.equal(shop.id)
    expect(t.networkId).to.be.equal(999)
    expect(t.wallet).to.be.equal(receipt.from)
    expect(t.type).to.be.equal(TransactionTypes.OfferCreated)
    expect(t.status).to.be.equal(TransactionStatuses.Confirmed)
    expect(t.hash).to.be.equal(receipt.transactionHash)
    expect(t.listingId).to.be.equal(lid)
    expect(t.offerId).to.be.equal(oid)
    expect(t.ipfsHash).to.be.equal(ipfsHash)
    expect(t.jobId).to.be.equal(job.jobId.toString())
  })
})
