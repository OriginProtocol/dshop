const randomstring = require('randomstring')

const get = require('lodash/get')

const { authShop, authSellerAndShop } = require('./_auth')
const { Network, Transaction, Order } = require('../models')
const { getConfig } = require('../utils/encryptedConfig')
const makeOffer = require('./_makeOffer')
const {
  OrderPaymentStatuses,
  TransactionTypes,
  TransactionStatuses
} = require('../enums')

module.exports = function (router) {
  /**
   * Called by the frontend when no payment is due, e.g. when a 100% off
   * discount code has been applied.
   */
  router.post(
    '/pay/no-charge',
    authShop,
    async (req, res, next) => {
      const { encryptedData } = req.body

      const network = await Network.findOne({
        where: { networkId: req.shop.networkId }
      })
      const networkConfig = getConfig(network.config)
      const shopConfig = getConfig(req.shop.config)
      const web3Pk = shopConfig.web3Pk || networkConfig.web3Pk

      if (!web3Pk) {
        return res.status(400).json({
          success: false,
          message: 'Error with payment server'
        })
      }

      if (!encryptedData) {
        return res.status(400).json({
          success: false,
          message: 'Missing order data'
        })
      }

      req.body.data = encryptedData
      req.amount = 0
      req.paymentCode = randomstring.generate()
      next()
    },
    makeOffer
  )

  router.post(
    '/offline-payments/order',
    authShop,
    async (req, res, next) => {
      const { shop } = req
      const { encryptedData, methodId } = req.body

      const network = await Network.findOne({
        where: { networkId: shop.networkId }
      })
      const networkConfig = getConfig(network.config)
      const shopConfig = getConfig(shop.config)
      const web3Pk = shopConfig.web3Pk || networkConfig.web3Pk

      // NOTE: `offlinePaymentMethods` values is duplicated
      // in both `config.json` and encrypted shop's config
      const availableOfflinePaymentMethods = get(
        shopConfig,
        'offlinePaymentMethods',
        []
      ).filter((method) => method.id === methodId && !method.disabled)

      if (!web3Pk || !availableOfflinePaymentMethods.length) {
        return res.status(400).send({
          success: false,
          message: 'Offline payments unavailable'
        })
      }

      if (!encryptedData) {
        return res.json({ success: false, message: 'Missing order data' })
      }

      const paymentCode = randomstring.generate()

      req.body.data = encryptedData
      req.amount = 0
      req.paymentCode = paymentCode
      req.paymentStatus = OrderPaymentStatuses.Pending

      // Insert a new row in Transaction table
      await Transaction.create({
        shopId: shop.id,
        networkId: network.networkId,
        type: TransactionTypes.Payment,
        status: TransactionStatuses.Pending,
        listingId: shop.listingId,
        customId: paymentCode // Record the paymentCode in the custom_id field.
      })

      next()
    },
    makeOffer
  )

  router.put(
    '/offline-payments/payment-state',
    authSellerAndShop,
    async (req, res) => {
      const { paymentCode, state } = req.body

      const tx = await Transaction.findOne({
        where: {
          customId: paymentCode,
          shopId: req.shop.id
        }
      })

      const order = await Order.findOne({
        where: {
          shopId: req.shop.id,
          paymentCode
        }
      })

      if (!tx || !order) {
        return res.status(200).send({
          reason: 'Invalid payment code'
        })
      }

      const orderStateToTxState = {
        [OrderPaymentStatuses.Paid]: TransactionStatuses.Confirmed,
        [OrderPaymentStatuses.Pending]: TransactionStatuses.Pending,
        [OrderPaymentStatuses.Refunded]: TransactionStatuses.Confirmed
      }

      await order.update({
        paymentStatus: state
      })

      await tx.update({
        status: orderStateToTxState[state]
      })

      res.status(200).send({ success: true })
    }
  )
}
