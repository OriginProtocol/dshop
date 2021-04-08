const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect

const {
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey
} = require('./utils')
const { Order, Product } = require('../models')
const encConf = require('../utils/encryptedConfig')
const { OrderPaymentStatuses, OrderPaymentTypes } = require('../utils/enums')
const { autoFulfillOrder } = require('../logic/printful')

describe('Printful', () => {
  let network, shop, shopConfig

  before(async () => {
    // Note: Enable the marketplace contract initially.
    // Then later in this test suite it gets disabled.
    network = await getOrCreateTestNetwork({ useMarketplace: true })

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
      pgpPrivateKey,
      inventory: true
    })

    shopConfig = encConf.getConfig(shop.config)
  })

  it('should add a fulfillment error to the order metadata', async () => {
    const productId = 'product_' + Date.now()
    await Product.create({
      shopId: shop.id,
      productId,
      stockLeft: 4,
      variantsStock: {
        0: 1,
        1: 3
      }
    })

    const orderData = {
      shopId: shop.id,
      networkId: network.id,
      paymentType: OrderPaymentTypes.Offline,
      paymentStatus: OrderPaymentStatuses.Pending,
      paymentCode: `customId-${Date.now()}`,
      shortId: 'testorderid',
      data: {
        items: [
          {
            product: productId,
            quantity: 1,
            price: 2500,
            variant: 0
          },
          {
            product: productId,
            quantity: 2,
            price: 2500,
            variant: 1
          }
        ]
      }
    }

    const order = await Order.create(orderData)

    await autoFulfillOrder(order, shopConfig, shop)

    // Since the shop does not have a printful API key we expect a fulfillment error.
    await order.reload()
    const expectedError = 'Auto-fulfillment error: Missing Printful API key'
    expect(order.data.autoFulfillError).to.be.a('string')
    expect(order.data.autoFulfillError).to.equal(expectedError)
    expect(order.data.error).to.be.an('array')
    expect(order.data.error.length).to.equal(1)
    expect(order.data.error[0]).to.equal(expectedError)
  })
})
