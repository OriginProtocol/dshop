const get = require('lodash/get')

const bodyParser = require('body-parser')
const randomstring = require('randomstring')
const Stripe = require('stripe')

const { Shop, ExternalPayment } = require('../models')
const { authShop } = require('./_auth')
const { getConfig } = require('../utils/encryptedConfig')
const makeOffer = require('./_makeOffer')

const rawJson = bodyParser.raw({ type: 'application/json' })

// Stripe CLI for testing webhook:
//    stripe login
//    stripe listen --forward-to localhost:3000/webhook
// Update stripe webhook in shop server config

module.exports = function (app) {
  app.post('/pay', authShop, async (req, res) => {
    if (req.body.amount < 50) {
      return res.status(400).send({
        success: false,
        message: 'Amount too low for credit card payment'
      })
    }

    const shopConfig = getConfig(req.shop.config)
    if (!shopConfig.web3Pk || !shopConfig.stripeBackend) {
      return res.status(400).send({
        success: false,
        message: 'CC payments unavailable'
      })
    }

    console.log('Trying to make payment...')
    const stripe = Stripe(shopConfig.stripeBackend)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'usd',
      statement_descriptor: req.shop.name,
      metadata: {
        shopId: req.shop.id,
        shopStr: req.shop.authToken,
        listingId: req.shop.listingId,
        encryptedData: req.body.data,
        payment_code: randomstring.generate()
      }
    })
    console.log('Payment request sent to Stripe')

    res.send({ success: true, client_secret: paymentIntent.client_secret })
  })

  async function handleWebhook(req, res, next) {
    let json
    console.log("🚖 STARTING WEBHOOK")
    try {
      json = JSON.parse(req.body.toString())
      const id = get(json, 'data.object.metadata.shopId')
      req.shop = await Shop.findOne({ where: { id } })
    } catch (err) {
      console.error('Error parsing body: ', err)
      return res.sendStatus(400)
    }

    console.log(" 🚜 PARSED")
    const externalPayment = await ExternalPayment.create({
      payment_at: new Date(json.created * 1000), // created is a unix timestamp
      external_id: json.id,
      data: json,
      accepted: false
    },{logging: console.log})

    if (!req.shop) {
      console.debug('Missing shopId from /webhook request')
      return res.sendStatus(400)
    }
    console.log(" 🚞 Wrote initial")
    const shopConfig = getConfig(req.shop.config)
    const stripe = Stripe(shopConfig.stripeBackend)
    console.log("🚟 Got config and stripe")
    let event
    const sig = req.headers['stripe-signature']
    try {
      const secret = shopConfig.stripeWebhookSecret
      event = stripe.webhooks.constructEvent(req.body, sig, secret)
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`)
      console.error(err)
      return res.sendStatus(400)
    }
    console.log("🌲 Decoded webhook")

    // Save global payment data
    externalPayment.authenticated = true
    externalPayment.type = get(event, 'type')
    externalPayment.payment_code = get(event, 'data.object.metadata.payment_code')
    externalPayment.amount = get(event, 'data.object.amount')
    externalPayment.currency = get(event, 'data.object.currency')
    externalPayment.fee = get(event, 'data.object.fee') || get(event, 'data.object.charges.data[0].fee')
    externalPayment.payment_intent = get(event, 'type').startsWith('payment_intent') ? get(event, 'data.object.id') : get(event, 'data.object.payment_intent')
    if(externalPayment.fee !== undefined){
      externalPayment.net = externalPayment.amount - externalPayment.fee
    }
    await externalPayment.save()
    console.log("🏓 saved payment data",externalPayment.id)

    if (event.type !== 'payment_intent.succeeded') {
      console.log(`Ignoring event ${event.type}`)
      return res.sendStatus(200)
    }
    console.log("🌲🌲🌲 Not ignoring this one!")
    console.log(JSON.stringify(event, null, 4))
    console.log("🍷 Loaded Data")

    req.body.data = get(event, 'data.object.metadata.encryptedData')
    req.amount = externalPayment.amount
    next()
  }

  app.post('/webhook', rawJson, handleWebhook, makeOffer)
}
