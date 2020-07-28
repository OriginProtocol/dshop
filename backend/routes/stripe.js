const get = require('lodash/get')

const bodyParser = require('body-parser')
const randomstring = require('randomstring')
const Stripe = require('stripe')

const { Shop, ExternalPayment, Network } = require('../models')
const { authShop } = require('./_auth')
const { getConfig } = require('../utils/encryptedConfig')
const { normalizeDescriptor } = require('../utils/stripe')
const { getLogger } = require('../utils/logger')

const makeOffer = require('./_makeOffer')

const { stripeWebhookErrorEmail } = require('../utils/emailer')

const log = getLogger('routes.stripe')

const rawJson = bodyParser.raw({ type: 'application/json' })

// Stripe CLI for testing webhook:
//    stripe login
//    stripe listen --forward-to localhost:3000/webhook
// Update stripe webhook in shop server config

module.exports = function (router) {
  router.post('/pay', authShop, async (req, res) => {
    if (req.body.amount < 50) {
      return res.status(400).send({
        success: false,
        message: 'Amount too low for credit card payment'
      })
    }

    const network = await Network.findOne({
      where: { networkId: req.shop.networkId }
    })
    const networkConfig = getConfig(network.config)
    const shopConfig = getConfig(req.shop.config)
    const web3Pk = shopConfig.web3Pk || networkConfig.web3Pk

    if (!web3Pk || !shopConfig.stripeBackend) {
      return res.status(400).send({
        success: false,
        message: 'CC payments unavailable'
      })
    }

    log.info('Trying to make payment...')
    const stripe = Stripe(shopConfig.stripeBackend)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'usd',
      statement_descriptor: normalizeDescriptor(req.shop.name),
      metadata: {
        shopId: req.shop.id,
        shopStr: req.shop.authToken,
        listingId: req.shop.listingId,
        encryptedData: req.body.data,
        paymentCode: randomstring.generate()
      }
    })
    log.info('Payment request sent to Stripe')

    res.send({ success: true, client_secret: paymentIntent.client_secret })
  })

  async function handleWebhook(req, res, next) {
    let bodyText, json
    try {
      bodyText = req.body.toString()
      json = JSON.parse(bodyText)
      const id = get(json, 'data.object.metadata.shopId')
      if (!id) {
        log.error('Webhook body data does not include shopId!')
        log.debug('JSON received:', json)
        return res.sendStatus(400)
      }
      req.shop = await Shop.findOne({ where: { id } })
    } catch (err) {
      log.error('Error parsing body: ', err)
      log.debug('Body received:', bodyText)
      return res.sendStatus(400)
    }

    // Save initial data into external payment.
    // We save this "raw" state for debugging purposes.
    // If anything goes wrong with the rest of this, we'll still be able
    // to look up the originaly posted JSON and see what happened.
    const externalPayment = await ExternalPayment.create({
      payment_at: new Date(json.created * 1000), // created is a unix timestamp
      external_id: json.id,
      data: json,
      accepted: false
    })

    if (!req.shop) {
      log.warning('Missing shopId from /webhook request')
      return res.sendStatus(400)
    }

    const shopConfig = getConfig(req.shop.config)
    const stripe = Stripe(shopConfig.stripeBackend)

    let event
    const sig = req.headers['stripe-signature']
    try {
      const secret = shopConfig.stripeWebhookSecret
      event = stripe.webhooks.constructEvent(req.body, sig, secret)
    } catch (err) {
      log.error(`⚠️ Webhook signature verification failed:`, err)
      try {
        await stripeWebhookErrorEmail(req.shop.id, {
          externalPaymentId: externalPayment.id,
          stackTrace: err.stack,
          message: err.message
        })
      } catch (error) {
        log.error('⚠️ Failed to send email', error)
      }
      return res.sendStatus(400)
    }

    // Save parsed data into the external_payment table.
    externalPayment.authenticated = true
    externalPayment.type = get(event, 'type')
    externalPayment.paymentCode = get(event, 'data.object.metadata.paymentCode')
    externalPayment.amount = get(event, 'data.object.amount')
    externalPayment.currency = get(event, 'data.object.currency')
    externalPayment.fee =
      get(event, 'data.object.fee') ||
      get(event, 'data.object.charges.data[0].fee')
    externalPayment.paymentIntent = get(event, 'type').startsWith(
      'payment_intent'
    )
      ? get(event, 'data.object.id')
      : get(event, 'data.object.payment_intent')
    if (externalPayment.fee !== undefined) {
      externalPayment.net = externalPayment.amount - externalPayment.fee
    }
    await externalPayment.save()

    log.debug(JSON.stringify(event, null, 4))

    if (event.type !== 'payment_intent.succeeded') {
      log.debug(`Ignoring event ${event.type}`)
      return res.sendStatus(200)
    }

    req.body.data = get(event, 'data.object.metadata.encryptedData')
    req.amount = externalPayment.amount
    req.paymentCode = externalPayment.paymentCode
    next()
  }

  router.post('/webhook', rawJson, handleWebhook, makeOffer)

  router.post('/stripe/check-creds', authShop, async (req, res) => {
    let valid = false

    try {
      const { stripeBackend } = req.body

      const stripe = Stripe(stripeBackend)

      await stripe.customers.list({ limit: 1 })

      valid = true
    } catch (err) {
      log.error('Failed to verify stripe credentials', err)
      valid = false
    }

    return res.status(200).send({
      success: true,
      valid
    })
  })
}
