const get = require('lodash/get')
const bodyParser = require('body-parser')
const randomstring = require('randomstring')

const PayPal = require('@paypal/checkout-server-sdk')

const { Network, ExternalPayment, Shop } = require('../models')
const { authShop } = require('./_auth')
const { getConfig } = require('../utils/encryptedConfig')
const { getLogger } = require('../utils/logger')

const {
  validateCredentials,
  getClient,
  verifySignMiddleware
} = require('../utils/paypal')

const makeOffer = require('./_makeOffer')

const rawJson = bodyParser.raw({ type: 'application/json' })
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
      const web3Pk = shopConfig.web3Pk || networkConfig.web3Pk

      const { clientId, currency } = req.body
      const { paypalClientSecret, paypalClientId } = shopConfig

      if (!web3Pk || !paypalClientSecret || !paypalClientId || clientId !== paypalClientId) {
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
              currency_code: (currency || 'USD'),
              value: req.body.amount
            },
            // PayPal doesn't support metadata,
            // so using invoice_id and custom_id instead
            invoice_id: randomstring.generate(), // paymentCode
            custom_id: req.body.data // encryptedData IPFS hash
          }
        ],
        application_context: {
          user_action: 'PAY_NOW',
          return_url: req.body.returnUrl,
          cancel_url: req.body.cancelUrl
        }
      })

      const response = await client.execute(request)

      log.debug(response.result)

      const authorizeUrl = response.result.links.find(
        (l) => l.rel === 'approve'
      ).href

      res.send({
        success: true,
        authorizeUrl,
        orderId: response.result.id
      })
    } catch (err) {
      log.error(`[Shop ${req.shop.id}] Failed to create order on PayPal`, err)
      res.send({
        success: false
      })
    }
  })

  router.post('/paypal/capture', authShop, async (req, res) => {
    try {
      const network = await Network.findOne({
        where: { networkId: req.shop.networkId }
      })

      const networkConfig = getConfig(network.config)
      const shopConfig = getConfig(req.shop.config)
      const web3Pk = shopConfig.web3Pk || networkConfig.web3Pk
      
      const { clientId } = req.body
      const { paypalClientSecret, paypalClientId } = shopConfig

      if (!web3Pk || !paypalClientSecret || !paypalClientId || clientId !== paypalClientId) {
        return res.status(400).send({
          success: false,
          reason: 'PayPal payment is disabled'
        })
      }


      log.info(
        `[Shop ${req.shop.id}] Çapturing payment on PayPal`,
        req.body.orderId
      )

      const client = getClient(paypalClientId, paypalClientSecret)

      const request = new PayPal.orders.OrdersCaptureRequest(req.body.orderId)

      const response = await client.execute(request)

      log.debug(response.result)

      res.send({
        success: true
      })
    } catch (err) {
      log.error(`[Shop ${req.shop.id}] Failed to create order on PayPal`, err)
      res.send({
        success: false
      })
    }
  })

  const findShop = async (req, res, next) => {
    const { shopId } = req.params
    const shop = await Shop.findOne({ where: { id: shopId } })
    req.shop = shop
    next()
  }

  const webhookHandler = async (req, res, next) => {
    const { shopId } = req.params

    try {
      const event = req.body

      const externalPayment = await ExternalPayment.create({
        payment_at: new Date(event.create_time),
        external_id: event.id,
        data: event,
        accepted: false
      })

      // Save parsed data into the external_payment table.
      externalPayment.authenticated = true
      externalPayment.type = get(event, 'event_type')
      externalPayment.paymentCode = get(
        event,
        'resource.purchase_units[0].invoice_id',
        get(event, 'resource.invoice_id')
      )
      externalPayment.amount = get(
        event,
        'resource.purchase_units[0].amount.value',
        get(event, 'resource.amount.value')
      )
      externalPayment.currency = get(
        event,
        'resource.purchase_units[0].amount.currency_code',
        get(event, 'resource.amount.currency_code')
      )
      externalPayment.fee = get(
        event,
        'resource.transaction_fee.value',
        get(event, 'resource.seller_receivable_breakdown.paypal_fee.value')
      )

      if (externalPayment.amount !== undefined) {
        externalPayment.amount = Number(externalPayment.amount) * 100
      }
      if (externalPayment.fee !== undefined) {
        externalPayment.fee = Number(externalPayment.fee) * 100
        externalPayment.net = externalPayment.amount - externalPayment.fee
      }
      await externalPayment.save()

      log.debug(JSON.stringify(event, null, 4))

      if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
        log.debug(`Ignoring event ${event.type}`)
        return res.sendStatus(200)
      }

      req.body.data = get(event, 'resource.custom_id')
      req.amount = externalPayment.amount
      req.paymentCode = externalPayment.paymentCode

      next()
    } catch (err) {
      log.error(`[Shop ${shopId}] Failed to process PayPal event`, err)
      log.debug('Body received:', req.body)
      return res.sendStatus(400)
    }
  }

  router.post(
    '/paypal/webhooks/:shopId',
    rawJson,
    findShop,
    verifySignMiddleware,
    webhookHandler,
    makeOffer
  )
}
