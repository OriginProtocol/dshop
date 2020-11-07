const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect

const {
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey,
  MockBullJob,
  createTestEncryptedOfferData
} = require('./utils')
const { processor } = require('../queues/makeOfferProcessor')
const { OrderPaymentStatuses, OrderPaymentTypes } = require('../enums')

describe('Cart', () => {
  let network, shop, key, job

  before(async () => {
    network = await getOrCreateTestNetwork()

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

  it('Order with an invalid cart', async () => {
    const scenarios = [
      {
        opts: { corruptPrice: true },
        error: {
          error: ['Incorrect price 99999 for product iron-mask'],
          offerError: 'Incorrect price 99999 for product iron-mask'
        }
      },
      {
        opts: { corruptSubTotal: true },
        error: {
          error: ['Invalid order: Subtotal'],
          offerError: 'Invalid order: Subtotal'
        }
      }
    ]

    for (const scenario of scenarios) {
      const { ipfsHash, data } = await createTestEncryptedOfferData(
        network,
        shop,
        key,
        scenario.opts
      )

      // Create a mock Bull job object.
      const jobData = {
        shopId: shop.id,
        amount: data.total,
        encryptedDataIpfsHash: ipfsHash,
        paymentCode: 'testPaymentCode' + Date.now(),
        paymentType: OrderPaymentTypes.CryptoCurrency
      }
      job = new MockBullJob(jobData)

      // Have the queue process the order.
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
      expect(order.data).to.eql({ ...data, ...scenario.error })
    }
  })
})
