const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect

const {
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey,
  MockBullJob,
  createTestEncryptedOfferData,
  apiRequest
} = require('./utils')
const { processor } = require('../queues/makeOfferProcessor')
const { Order, Transaction } = require('../models')
const {
  OrderPaymentStatuses,
  TransactionTypes,
  TransactionStatuses,
  OrderPaymentTypes
} = require('../enums')
const { ListingID, OfferID } = require('../utils/id')

describe('Offers', () => {
  let network, shop, key, job, jobId, trans

  before(async () => {
    // Note: Enable the marketplace contract initially.
    // Then later in this test suite it gets disabled.
    network = await getOrCreateTestNetwork({ useMarketplace: true })

    // Use account 1 as the merchant's.
    const sellerWallet = getTestWallet(1)
    const sellerPk = sellerWallet.privateKey

    // Create the merchant's PGP key.
    const pgpPrivateKeyPass = 'password123'
    key = await generatePgpKey('tester', pgpPrivateKeyPass)
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

  it('It should make an on-chain offer', async () => {
    // Create a mock Bull job object.
    const data = {
      shopId: shop.id,
      amount: '100',
      encryptedDataIpfsHash: 'IpfsHashOfEncryptedOfferData', // TODO: replace with a real hash.
      paymentCode: 'testPaymentCode' + Date.now(),
      paymentType: OrderPaymentTypes.CryptoCurrency
    }
    job = new MockBullJob(data)
    jobId = `${job.queue.name}-${job.id}`

    // Call the processor to record the offer on the blockchain.
    const { receipt, listingId, offerId, ipfsHash } = await processor(job)

    const lid = new ListingID(listingId, 999)
    const oid = new OfferID(listingId, offerId, 999)
    expect(shop.listingId).to.equal(lid.toString())
    expect(oid.toString()).to.startsWith(lid.toString())

    // A transaction row should have been created.
    trans = await Transaction.findOne({ where: { jobId } })
    expect(trans).to.be.an('object')
    expect(trans.shopId).to.be.equal(shop.id)
    expect(trans.networkId).to.be.equal(999)
    expect(trans.fromAddress).to.be.equal(receipt.from)
    expect(trans.toAddress).to.be.equal(receipt.to)
    expect(trans.type).to.be.equal(TransactionTypes.OfferCreated)
    expect(trans.status).to.be.equal(TransactionStatuses.Confirmed)
    expect(trans.hash).to.be.equal(receipt.transactionHash)
    expect(trans.listingId).to.be.equal(lid.toString())
    expect(trans.offerId).to.be.equal(oid.toString())
    expect(trans.ipfsHash).to.be.equal(ipfsHash)
    expect(trans.jobId).to.be.equal(jobId)
    expect(trans.customId).to.be.equal(job.data.paymentCode)
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

    trans = await Transaction.findOne({ where: { jobId } })
    expect(trans).to.be.an('object')
    expect(trans.shopId).to.be.equal(shop.id)
    expect(trans.networkId).to.be.equal(999)
    expect(trans.fromAddress).to.be.equal(receipt.from)
    expect(trans.toAddress).to.be.equal(receipt.to)
    expect(trans.type).to.be.equal(TransactionTypes.OfferCreated)
    expect(trans.status).to.be.equal(TransactionStatuses.Confirmed)
    expect(trans.hash).to.be.equal(receipt.transactionHash)
    expect(trans.listingId).to.be.equal(lid.toString())
    expect(trans.offerId).to.be.equal(oid.toString())
    expect(trans.ipfsHash).to.be.equal(ipfsHash)
    expect(trans.jobId).to.be.equal(jobId)
    expect(trans.customId).to.be.equal(job.data.paymentCode)
  })

  it('It should not recover a tx from another job', async () => {
    // Create a pending transaction from the same wallet but with a different jobId.
    await Transaction.create({
      shopId: shop.id,
      networkId: network.networkId,
      fromAddress: trans.fromAddress,
      toAddress: network.marketplaceContract,
      type: TransactionTypes.OfferCreated,
      status: TransactionStatuses.Pending,
      hash: trans.hash,
      listingId: trans.listingId,
      ipfsHash: trans.ipfsHash,
      jobId: 'job' + Date.now(), // different job id.
      paymentCode: 'code' + Date.now()
    })

    // Reprocess the job. The logic should load up the new pending transaction
    // and bail when it detects the job id differs.
    let failure = false
    try {
      await processor(job)
    } catch (e) {
      failure = true
    }
    expect(failure).to.be.true
  })

  it('It should make an off-chain offer', async () => {
    // Update the network config to disable the use of the marketplace contract.
    await network.update({ useMarketplace: false })

    const { ipfsHash, data } = await createTestEncryptedOfferData(
      network,
      shop,
      key
    )

    // Create a mock Bull job object.
    const jobData = {
      shopId: shop.id,
      amount: '200',
      encryptedDataIpfsHash: ipfsHash,
      paymentCode: 'testPaymentCode' + Date.now(),
      paymentType: OrderPaymentTypes.CryptoCurrency
    }
    job = new MockBullJob(jobData)
    jobId = `${job.queue.name}-${job.id}`

    // Call the processor to record the offer off-chain. It should return an Order DB row.
    const order = await processor(job)
    expect(order).to.be.an('object')
    expect(order.fqId).to.be.a('string')
    expect(order.shortId).to.be.a('string')
    expect(order.networkId).to.equal(999)
    expect(order.shopId).to.equal(shop.id)
    expect(order.paymentStatus).to.equal(OrderPaymentStatuses.Paid)
    expect(order.offerId).to.be.undefined
    expect(order.offerStatus).to.be.undefined
    expect(order.createdBlock).to.be.undefined
    expect(order.updatedBlock).to.be.undefined
    expect(order.ipfsHash).to.be.a('string')
    expect(order.encryptedIpfsHash).to.equal(ipfsHash)
    expect(order.paymentCode).to.equal(jobData.paymentCode)
    expect(order.paymentType).to.equal(jobData.paymentType)
    expect(order.total).to.equal(data.total)
    expect(order.currency).to.equal(data.currency)
    expect(order.data).to.eql(data)
  })

  it('It should make an off-chain offer with offline payment method', async () => {
    // Update the network config to disable the use of the marketplace contract.
    await network.update({ useMarketplace: false })

    const { ipfsHash, data } = await createTestEncryptedOfferData(
      network,
      shop,
      key
    )

    // Create a mock Bull job object.
    const jobData = {
      shopId: shop.id,
      amount: '200',
      encryptedDataIpfsHash: ipfsHash,
      paymentCode: 'testPaymentCode' + Date.now(),
      paymentType: OrderPaymentTypes.Offline
    }
    job = new MockBullJob(jobData)
    jobId = `${job.queue.name}-${job.id}`

    // Call the processor to record the offer off-chain. It should return an Order DB row.
    const order = await processor(job)
    expect(order).to.be.an('object')
    expect(order.fqId).to.be.a('string')
    expect(order.shortId).to.be.a('string')
    expect(order.networkId).to.equal(999)
    expect(order.shopId).to.equal(shop.id)
    expect(order.paymentStatus).to.equal(OrderPaymentStatuses.Pending)
    expect(order.offerId).to.be.undefined
    expect(order.offerStatus).to.be.undefined
    expect(order.createdBlock).to.be.undefined
    expect(order.updatedBlock).to.be.undefined
    expect(order.ipfsHash).to.be.a('string')
    expect(order.encryptedIpfsHash).to.equal(ipfsHash)
    expect(order.paymentCode).to.equal(jobData.paymentCode)
    expect(order.paymentType).to.equal(jobData.paymentType)
    expect(order.total).to.equal(data.total)
    expect(order.currency).to.equal(data.currency)
    expect(order.data).to.eql(data)

    const tx = await Transaction.findOne({
      where: {
        customId: order.paymentCode
      }
    })

    // Should not have a Tx associated
    expect(tx).to.be.null
  })

  it('should update payment state of an offline-payment order', async () => {
    const orderData = {
      shopId: shop.id,
      networkId: network.id,
      paymentType: OrderPaymentTypes.Offline,
      paymentStatus: OrderPaymentStatuses.Pending,
      paymentCode: `customId-${Date.now()}`,
      shortId: 'testorderid'
    }

    await Order.create(orderData)

    const resp = await apiRequest({
      method: 'put',
      endpoint: `/orders/testorderid/payment-state`,
      body: {
        paymentCode: orderData.paymentCode,
        state: OrderPaymentStatuses.Paid
      },
      headers: {
        authorization: `Bearer ${shop.authToken}`
      }
    })
    expect(resp.success).to.be.true

    const order = await Order.findOne({
      where: {
        paymentCode: orderData.paymentCode
      }
    })

    expect(order.paymentStatus).to.equal(OrderPaymentStatuses.Paid)
  })
})
