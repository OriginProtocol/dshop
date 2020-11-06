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
const { Discount } = require('../models')
const { OrderPaymentStatuses, OrderPaymentTypes } = require('../enums')

describe('Discounts', () => {
  let network,
    shop,
    key,
    job,
    fixedDiscount,
    percentageDiscount,
    paymentDiscount

  before(async () => {
    // Note: Enable the marketplace contract initially.
    // Then later in this test suite it gets disabled.
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

    // Create fixed and percentage discounts for the shop.
    fixedDiscount = await Discount.create({
      shopId: shop.id,
      status: 'active',
      code: '1DOLLAROFF',
      discountType: 'fixed',
      value: 1, // $1 off
      maxUses: null,
      onePerCustomer: false,
      startTime: Date.now(),
      endTime: null
    })
    percentageDiscount = await Discount.create({
      shopId: shop.id,
      status: 'active',
      code: '10PCTOFF',
      discountType: 'percentage',
      value: 10, // 10% off
      maxUses: null,
      onePerCustomer: false,
      startTime: Date.now(),
      endTime: null,
      minCartValue: 100,
      maxDiscountValue: 1000
    })
    paymentDiscount = await Discount.create({
      shopId: shop.id,
      status: 'active',
      code: '',
      discountType: 'payment',
      value: 10, // 10% off
      maxUses: null,
      onePerCustomer: false,
      startTime: Date.now(),
      endTime: null,
      data: {
        stripe: true,
        crypto: {
          OGN: true,
          OUSD: true
        }
      }
    })
  })

  it('Order with a fixed or percentage discount', async () => {
    for (const discount of [fixedDiscount, percentageDiscount]) {
      const { ipfsHash, data } = await createTestEncryptedOfferData(
        network,
        shop,
        key,
        discount
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
      expect(order.data).to.eql(data)
    }
  })

  it('Order with an invalid discount', async () => {
    const scenarios = [
      // Discount that does not exist for the shop.
      {
        discount: { code: 'DOESNOTEXIST', value: '10', discountType: 'fixed' },
        error: 'Discount error: Invalid discount code'
      },
      // Discount that creates inconsistent cart data.
      {
        discount: {
          ...fixedDiscount.get({ plain: true }),
          corruptTestData: true
        },
        error: 'Discount error: Cart value mismatch'
      }
    ]

    for (const scenario of scenarios) {
      const { ipfsHash, data } = await createTestEncryptedOfferData(
        network,
        shop,
        key,
        scenario.discount
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

      // We expect the order to go thru but an error to be recorded in the data.
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
      expect(order.data).to.eql({
        ...data,
        discountError: scenario.error,
        error: [scenario.error]
      })
    }
  })

  it.only('Order with a payment-specific discount', async () => {
    const scenarios = [
      {
        discount: paymentDiscount,
        paymentMethod: {
          id: 'stripe',
          label: 'Credit Card'
        },
        paymentType: OrderPaymentTypes.CreditCard
      },
      {
        discount: paymentDiscount,
        paymentMethod: {
          id: 'crypto',
          label: 'Crypto',
          token: 'OGN'
        },
        paymentType: OrderPaymentTypes.CryptoCurrency
      },
      {
        discount: paymentDiscount,
        paymentMethod: {
          id: 'crypto',
          label: 'Crypto',
          token: 'OUSD'
        },
        paymentType: OrderPaymentTypes.CryptoCurrency
      },
      {
        discount: paymentDiscount,
        paymentMethod: {
          id: 'paypal',
          label: 'PayPal'
        },
        error: 'Discount error: Cart value mismatch',
        paymentType: OrderPaymentTypes.PayPal
      }
    ]

    for (const scenario of scenarios) {
      const { ipfsHash, data } = await createTestEncryptedOfferData(
        network,
        shop,
        key,
        scenario.discount,
        scenario.paymentMethod
      )

      // Create a mock Bull job object.
      const jobData = {
        shopId: shop.id,
        amount: data.total,
        encryptedDataIpfsHash: ipfsHash,
        paymentCode: 'testPaymentCode' + Date.now(),
        paymentType: scenario.paymentType
      }
      job = new MockBullJob(jobData)

      // Have the queue process the order.
      const order = await processor(job)

      const expectedData = {
        ...data
      }

      if (scenario.error) {
        expectedData.discountError = scenario.error
        expectedData.error = [scenario.error]
      }

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
      expect(order.data).to.eql(expectedData)
    }
  })
})
