const get = require('lodash/get')

const bodyParser = require('body-parser')
const randomstring = require('randomstring')
const Stripe = require('stripe')

const { validateStripeKeys } = require('@origin/utils/stripe')

const { Shop, ExternalPayment, Network } = require('../models')
const { authShop } = require('./_auth')
const { getConfig } = require('../utils/encryptedConfig')
const stripeUtils = require('../utils/stripe')
const { getLogger } = require('../utils/logger')

const makeOffer = require('./_makeOffer')

const stripeWebhookErrorEmail = require('../utils/emails/stripeWebhookError')
const { OrderPaymentTypes } = require('../enums')

const log = getLogger('routes.stripe')

const rawJson = bodyParser.raw({ type: 'application/json' })

/**
 * Try and make sure this Stripe webhook call is one created by Dshop and not
 * some other eCommerce software.
 *
 * @param reqJSON {object} - Parsed JSON request body
 * @returns {boolean} - If it looksl ike our payment
 */
function hasDshopMetadata(reqJSON) {
  if (!reqJSON || typeof reqJSON !== 'object') return false

  const metadata = get(reqJSON, 'data.object.metadata')

  return (
    typeof metadata === 'object' &&
    metadata.shopId &&
    metadata.shopStr &&
    metadata.listingId &&
    metadata.encryptedData
  )
}

// Stripe CLI for testing webhook:
//    stripe login
//    stripe listen --forward-to localhost:3000/webhook
// Update stripe webhook in shop server config

module.exports = function (router) {
  /**
   * Creates a payment intent on Stripe and sends
   * back the client secret, so that the payment
   * can be captured later
   *
   * @param {Number} amount  value of order in cents
   * @param {String} currency currency code, falls back to 'usd'
   * @param {String} data Offer's IPFS hash
   *
   * @returns {{
   *  success,
   *  client_secret,
   *  message
   * }}
   */
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

    const valid = await stripeUtils.webhookValidation(
      req.shop,
      shopConfig,
      shopConfig.stripeWebhookHost || networkConfig.backendUrl
    )

    if (!web3Pk || !valid) {
      log.error(
        `[Shop ${req.shop.id}] Failed to make payment on Stripe, invalid/missing credentials`
      )
      return res.status(400).send({
        success: false,
        message: 'CC payments unavailable'
      })
    }

    log.info('Trying to make payment...')
    const stripe = Stripe(shopConfig.stripeBackend)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: req.body.currency || 'usd',
      statement_descriptor: stripeUtils.normalizeDescriptor(req.shop.name),
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

      /**
       * Probably not a payment created by Dshop or one we can't do aything
       * with. We should fail gracefully here so we can coexist with other
       * payment software on the same Stripe account/key.  Otherwise, it will
       * appear to be errors to Stripe and they will alert the user.
       */
      if (!hasDshopMetadata(json)) {
        const stripeID = get(json, 'id')
        log.info(
          `Webhook request received is not recognized as a Dshop payment (${stripeID})`
        )
        return res.sendStatus(204)
      }

      const id = get(json, 'data.object.metadata.shopId')

      if (id) {
        req.shop = await Shop.findOne({ where: { id } })
      }
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
      log.warn('Missing shopId from /webhook request')
      log.debug('JSON received:', json)
      return res.sendStatus(400)
    }

    log.info(`Processing webhook call for shop ${req.shop.id}...`)

    const shopConfig = getConfig(req.shop.config)
    const stripe = Stripe(shopConfig.stripeBackend)

    let event
    const sig = req.headers['stripe-signature']
    try {
      const secret = shopConfig.stripeWebhookSecret
      event = stripe.webhooks.constructEvent(req.body, sig, secret)
    } catch (err) {
      try {
        if (json) {
          // Check if an event with the ID has already been processed
          // If yes, the event could be from an old webhook registration
          const existingDBItem = await ExternalPayment.findOne({
            where: {
              authenticated: true,
              external_id: json.id
            }
          })

          if (existingDBItem) {
            log.debug(
              `[Shop ${req.shop.id}] Duplicate event with different sign: ${json.id}`
            )
            // Send 200 status, so that Stripe doesn't try to
            // resend this event again
            return res.sendStatus(200)
          }
        }

        log.error(`⚠️ Webhook signature verification failed:`, err)
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
    req.paymentType = OrderPaymentTypes.CreditCard
    next()
  }

  router.post('/webhook', rawJson, handleWebhook, makeOffer)

  /**
   * Validates the Stripe credentials
   *
   * NOTE: Doesn't validate public key
   *
   * @param {String} stripeKey Publishable key
   * @param {String} stripeBackend Secret key
   * @param {String} stripeWebhookHost Host value to override networkConfig.backend
   */
  router.post('/stripe/check-creds', authShop, async (req, res) => {
    let valid = false
    let shouldUpdateWebhooks = true

    const { stripeKey, stripeBackend, stripeWebhookHost } = req.body

    let backendUrl = stripeWebhookHost

    if (
      validateStripeKeys({
        publishableKey: stripeKey,
        secretKey: stripeBackend
      })
    ) {
      try {
        const stripe = Stripe(stripeBackend)

        await stripe.customers.list({ limit: 1 })

        if (!backendUrl) {
          // NOTE: `stripeWebhookHost` is only to be used in development environment,
          // since localhost cannot be used for webhooks. It'd undefined and replaced
          // with `networkConfig.backend` on prod.
          //
          // Could use Stripe CLI for webhooks instead of registering webhooks
          // while running locally, but this way is closer to how things run on prod.
          // Would be easier to identify/reproduce bugs on local, if any.

          const network = await Network.findOne({
            where: { networkId: req.shop.networkId }
          })
          const networkConfig = getConfig(network.config)

          backendUrl = networkConfig.backendUrl
        }

        valid = true

        shouldUpdateWebhooks = !(await stripeUtils.webhookValidation(
          req.shop,
          {
            stripeBackend
          },
          backendUrl
        ))
      } catch (err) {
        log.error(`[Shop ${req.shop.id}] Failed to verify stripe credentials`)
        log.debug(err)
      }
    }

    return res.json({ success: true, valid, shouldUpdateWebhooks })
  })
}
