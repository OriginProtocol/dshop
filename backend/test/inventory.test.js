const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect

const {
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey,
  apiRequest
} = require('./utils')
const { Order, Product } = require('../models')
const { OrderPaymentStatuses, OrderPaymentTypes } = require('../utils/enums')

describe('Inventory', () => {
  let network, shop

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

    await Order.destroy({
      truncate: true
    })
    await Product.destroy({
      truncate: true
    })
  })

  it('should update inventory on placing an order', async () => {
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

    await Order.create(orderData)

    const resp = await apiRequest({
      method: 'put',
      endpoint: `/orders/${orderData.shortId}/payment-state`,
      body: {
        paymentCode: orderData.paymentCode,
        state: OrderPaymentStatuses.Paid
      },
      headers: {
        authorization: `Bearer ${shop.shopSlug}`
      }
    })
    expect(resp.success).to.be.true

    const product = await Product.findOne({
      where: {
        shopId: shop.id,
        productId
      }
    })
    expect(product).to.be.an('object')
    expect(product.stockLeft).to.equal(1)
    expect(product.variantsStock[0]).to.equal(0)
    expect(product.variantsStock[1]).to.equal(1)
  })

  it('should update inventory on cancelling an order', async () => {
    const productId = 'product2_' + Date.now()
    await Product.create({
      shopId: shop.id,
      productId,
      stockLeft: 1,
      variantsStock: {
        0: 0,
        1: 1
      }
    })

    const orderData = {
      shopId: shop.id,
      networkId: network.id,
      paymentType: OrderPaymentTypes.Offline,
      paymentStatus: OrderPaymentStatuses.Pending,
      paymentCode: `customId2-${Date.now()}`,
      shortId: 'testorderid2',
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

    await Order.create(orderData)

    const resp = await apiRequest({
      method: 'put',
      endpoint: `/orders/${orderData.shortId}/payment-state`,
      body: {
        paymentCode: orderData.paymentCode,
        state: OrderPaymentStatuses.Rejected
      },
      headers: {
        authorization: `Bearer ${shop.shopSlug}`
      }
    })
    expect(resp.success).to.be.true

    const product = await Product.findOne({
      where: {
        shopId: shop.id,
        productId
      }
    })
    expect(product).to.be.an('object')
    expect(product.stockLeft).to.equal(4)
    expect(product.variantsStock[0]).to.equal(1)
    expect(product.variantsStock[1]).to.equal(3)
  })

  it('should not update inventory when out of stock', async () => {
    const productId = 'product3_' + Date.now()
    await Product.create({
      shopId: shop.id,
      productId,
      stockLeft: 1,
      variantsStock: {
        0: 0,
        2: 1
      }
    })

    const orderData = {
      shopId: shop.id,
      networkId: network.id,
      paymentType: OrderPaymentTypes.Offline,
      paymentStatus: OrderPaymentStatuses.Pending,
      paymentCode: `customId3-${Date.now()}`,
      shortId: 'testorderid3',
      data: {
        items: [
          {
            product: productId,
            quantity: 1,
            price: 2500,
            variant: 0
          }
        ]
      }
    }

    await Order.create(orderData)

    const resp = await apiRequest({
      method: 'put',
      endpoint: `/orders/${orderData.shortId}/payment-state`,
      body: {
        paymentCode: orderData.paymentCode,
        state: OrderPaymentStatuses.Paid
      },
      headers: {
        authorization: `Bearer ${shop.shopSlug}`
      }
    })
    expect(resp.success).to.be.true

    const order = await Order.findOne({
      where: {
        paymentCode: orderData.paymentCode
      }
    })

    expect(order.data.inventoryError).to.equal(
      'Some products in this order are out of stock'
    )

    const product = await Product.findOne({
      where: {
        shopId: shop.id,
        productId
      }
    })
    expect(product).to.be.an('object')
    expect(product.stockLeft).to.equal(1)
    expect(product.variantsStock[0]).to.equal(0)
    expect(product.variantsStock[2]).to.equal(1)
  })
})
