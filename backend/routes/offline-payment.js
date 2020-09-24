const randomstring = require('randomstring')

const get = require('lodash/get')

const { authShop, authSellerAndShop } = require('./_auth')
const { Network, Order } = require('../models')
const { getConfig } = require('../utils/encryptedConfig')
const { autoFulfillOrder } = require('../utils/printful')
const makeOffer = require('./_makeOffer')
const { OrderPaymentTypes, OrderPaymentStatuses } = require('../enums')

const { getLogger } = require('../utils/logger')
const log = getLogger('routes.offline-payment')

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
      req.paymentType = OrderPaymentTypes.Offline

      next()
    },
    makeOffer
  )

  /**
   * To update the payment state of an offline-payment order
   *
   * @param {String} paymentCode the custom ID of the external payment
   * @param {enums.OrderPaymentStatuses} state new payment state to set
   */
  router.put(
    '/offline-payments/payment-state',
    authSellerAndShop,
    async (req, res) => {
      const { paymentCode, state } = req.body
      const shopConfig = getConfig(req.shop.config)
      const shop = req.shop

      const order = await Order.findOne({
        where: {
          shopId: shop.id,
          paymentCode,
          paymentType: OrderPaymentTypes.Offline
        }
      })

      if (!order) {
        return res.status(200).send({
          reason: 'Invalid payment code'
        })
      }

      // TODO: add some checks to avoid invalid transition of states
      // Like state should never go back from "Paid" to "Pending"
      log.info(`Updating payment status of order ${order.fqId} to ${state}`)
      await order.update({
        paymentStatus: state
      })

      // Full-fill the order if the payment was marked as "Paid"
      // and the shop has auto-fulfillment enabled.
      if (
        shopConfig.printful &&
        shopConfig.printfulAutoFulfill &&
        state === OrderPaymentStatuses.Paid
      ) {
        log.info(`Auto-fullfilling order ${order.fqId}`)
        await autoFulfillOrder(order, shopConfig, shop)
      }

      res.status(200).send({ success: true })
    }
  )
}
