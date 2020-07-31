const randomstring = require('randomstring')
const fs = require('fs')

const PayPal = require('@paypal/checkout-server-sdk')

const { Network } = require('../models')
const { authShop } = require('./_auth')
const { getConfig } = require('../utils/encryptedConfig')
const { getLogger } = require('../utils/logger')
const { DSHOP_CACHE } = require('../utils/const')

const { validateCredentials, getClient } = require('../utils/paypal')

const log = getLogger('routes.paypal')

module.exports = function (router) {
  router.post('/paypal/check-creds', authShop, async (req, res) => {
    let valid = false

    try {
      // Try generating an auth token
      const { paypalClientId, paypalClientSecret } = req.body

      valid = await validateCredentials(paypalClientId, paypalClientSecret)
    } catch (err) {
      log.error('Failed to verify paypal credentials', err)
      valid = false
    }

    return res.status(200).send({
      success: true,
      valid
    })
  })

  router.post('/paypal/pay', authShop, async (req, res) => {
    try {
      const network = await Network.findOne({
        where: { networkId: req.shop.networkId }
      })

      const networkConfig = getConfig(network.config)
      const shopConfig = getConfig(req.shop.config)
      const config = JSON.parse(
        fs.readFileSync(`${DSHOP_CACHE}/${req.shop.authToken}/data/config.json`)
      )
      const web3Pk = shopConfig.web3Pk || networkConfig.web3Pk

      const { paypalClientId } = config
      const { paypalClientSecret } = shopConfig

      if (!web3Pk || !paypalClientSecret || !paypalClientId) {
        return res.status(400).send({
          success: false,
          reason: 'PayPal payment is disabled'
        })
      }

      const client = getClient(paypalClientId, paypalClientSecret)

      const request = new PayPal.orders.OrdersCreateRequest()
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: req.body.amount
            },
            custom_id: randomstring.generate()
          }
        ],
        order_application_context: {
          user_action: 'PAY_NOW',
          return_url: req.body.returnUrl,
          cancel_url: req.body.cancelUrl
        }
      })

      const response = await client.execute(request)

      const authorizeUrl = response.result.links.find(
        (l) => l.rel === 'approve'
      ).href

      res.send({
        success: true,
        authorizeUrl
      })
    } catch (err) {
      log.error(`[Shop ${req.shop.id}] Failed to create order on PayPal`, err)
      res.send({
        success: false
      })
    }
  })
}
