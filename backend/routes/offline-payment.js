const randomstring = require('randomstring')

const get = require('lodash/get')

const { authSellerAndShop, authShop } = require('./_auth')
const { Network } = require('../models')
const { getConfig } = require('../utils/encryptedConfig')
const makeOffer = require('./_makeOffer')

module.exports = function (router) {
  router.post(
    '/offline-payments/order',
    authShop,
    async (req, res, next) => {
      const network = await Network.findOne({
        where: { networkId: req.shop.networkId }
      })
      const networkConfig = getConfig(network.config)
      const shopConfig = getConfig(req.shop.config)
      const web3Pk = shopConfig.web3Pk || networkConfig.web3Pk

      const availableOfflinePaymentMethods = get(
        shopConfig,
        'offlinePaymentMethods',
        []
      ).filter((method) => !method.disabled)

      if (!web3Pk || !availableOfflinePaymentMethods.length) {
        return res.status(400).send({
          success: false,
          message: 'Offline payments unavailable'
        })
      }

      const { encryptedData } = req.body
      if (!encryptedData) {
        return res.json({ success: false, message: 'Missing order data' })
      }

      req.body.data = encryptedData
      req.amount = 0
      req.paymentCode = randomstring.generate()
      next()
    },
    makeOffer
  )

  router.put('/offline-payments', authSellerAndShop, (req, res) => {
    //
    return res.status(200)
  })
}
