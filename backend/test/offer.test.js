const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect

const {
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey,
  MockBullJob
} = require('./utils')
const { processor } = require('../queues/makeOfferProcessor')
const { Transaction } = require('../models')
const { TransactionTypes, TransactionStatuses } = require('../enums')
const { ListingID, OfferID } = require('../utils/id')

describe('Offers', () => {
  let shop

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
  })

  it('It should make an offer', async () => {
    // Create a mock Bull job object.
    const data = {
      shopId: shop.id,
      amount: '100',
      encryptedData: 'IpfsHashOfEncryptedOfferData', // TODO: replace with a real hash.
      paymentCode: 'testPaymentCode' + Date.now()
    }
    const job = new MockBullJob(data)

    // Call the processor to record the offer on the blockchain.
    const { receipt, listingId, offerId, ipfsHash } = await processor(job)

    const lid = new ListingID(listingId, 999)
    const oid = new OfferID(listingId, offerId, 999)
    expect(shop.listingId).to.equal(lid.toString())
    expect(oid.toString()).to.startsWith(lid.toString())

    // A transaction row should have been created.
    const t = await Transaction.findOne({ where: { jobId: job.id.toString() } })
    expect(t).to.be.an('object')
    expect(t.shopId).to.be.equal(shop.id)
    expect(t.networkId).to.be.equal(999)
    expect(t.from).to.be.equal(receipt.from)
    expect(t.to).to.be.equal(receipt.to)
    expect(t.type).to.be.equal(TransactionTypes.OfferCreated)
    expect(t.status).to.be.equal(TransactionStatuses.Confirmed)
    expect(t.hash).to.be.equal(receipt.transactionHash)
    expect(t.listingId).to.be.equal(lid.toString())
    expect(t.offerId).to.be.equal(oid.toString())
    expect(t.ipfsHash).to.be.equal(ipfsHash)
    expect(t.jobId).to.be.equal(job.id.toString())
  })
})
