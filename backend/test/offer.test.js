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
  let network, shop, job, trans

  before(async () => {
    network = await getOrCreateTestNetwork()

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
    job = new MockBullJob(data)

    // Call the processor to record the offer on the blockchain.
    const { receipt, listingId, offerId, ipfsHash } = await processor(job)

    const lid = new ListingID(listingId, 999)
    const oid = new OfferID(listingId, offerId, 999)
    expect(shop.listingId).to.equal(lid.toString())
    expect(oid.toString()).to.startsWith(lid.toString())

    // A transaction row should have been created.
    trans = await Transaction.findOne({ where: { jobId: job.id.toString() } })
    expect(trans).to.be.an('object')
    expect(trans.shopId).to.be.equal(shop.id)
    expect(trans.networkId).to.be.equal(999)
    expect(trans.from).to.be.equal(receipt.from)
    expect(trans.to).to.be.equal(receipt.to)
    expect(trans.type).to.be.equal(TransactionTypes.OfferCreated)
    expect(trans.status).to.be.equal(TransactionStatuses.Confirmed)
    expect(trans.hash).to.be.equal(receipt.transactionHash)
    expect(trans.listingId).to.be.equal(lid.toString())
    expect(trans.offerId).to.be.equal(oid.toString())
    expect(trans.ipfsHash).to.be.equal(ipfsHash)
    expect(trans.jobId).to.be.equal(job.id.toString())
  })

  it('It should recover from a process interruption', async () => {
    // Simulate the processing being interrupted while waiting
    // for the mining of the transaction.

    // Reset the transaction status in the DB.
    await trans.update({ status: TransactionStatuses.Pending })

    // Call the processor on the same job. This is equivalent of a retry.
    const { receipt, listingId, offerId, ipfsHash } = await processor(job)

    const lid = new ListingID(listingId, 999)
    const oid = new OfferID(listingId, offerId, 999)
    expect(shop.listingId).to.equal(lid.toString())
    expect(oid.toString()).to.startsWith(lid.toString())

    // A transaction row should have been created.
    trans = await Transaction.findOne({ where: { jobId: job.id.toString() } })
    expect(trans).to.be.an('object')
    expect(trans.shopId).to.be.equal(shop.id)
    expect(trans.networkId).to.be.equal(999)
    expect(trans.from).to.be.equal(receipt.from)
    expect(trans.to).to.be.equal(receipt.to)
    expect(trans.type).to.be.equal(TransactionTypes.OfferCreated)
    expect(trans.status).to.be.equal(TransactionStatuses.Confirmed)
    expect(trans.hash).to.be.equal(receipt.transactionHash)
    expect(trans.listingId).to.be.equal(lid.toString())
    expect(trans.offerId).to.be.equal(oid.toString())
    expect(trans.ipfsHash).to.be.equal(ipfsHash)
    expect(trans.jobId).to.be.equal(job.id.toString())
  })

  it('It should not recover a tx from another job', async () => {
    // Create a pending transaction from the same wallet but with a different jobId.
    await Transaction.create({
      shopId: shop.id,
      networkId: network.networkId,
      from: trans.from,
      to: network.marketplaceContract,
      type: TransactionTypes.OfferCreated,
      status: TransactionStatuses.Pending,
      hash: trans.hash,
      listingId: trans.listingId,
      ipfsHash: trans.ipfsHash,
      jobId: Date.now() // different job id.
    })

    // Reprocess the job. The logc should load up the new pending transaction
    // and bail when it detects the job id differs.
    let failure = false
    try {
      await processor(job)
    } catch (e) {
      failure = true
    }
    expect(failure).to.be.true
  })
})
