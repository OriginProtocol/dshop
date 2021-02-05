const get = require('lodash/get')
const { authSellerAndShop, authShop } = require('./_auth')
const { decryptConfig } = require('../utils/encryptedConfig')
const { findOrder } = require('../utils/orders')
const { PrintfulWebhookEvents } = require('../utils/enums')
const {
  fetchOrder,
  placeOrder,
  confirmOrder,
  fetchShippingEstimate,
  fetchTaxRates
} = require('../logic/printful')
const {
  processShippedEvent,
  processUpdatedEvent
} = require('../logic/printful/webhook')
const { ExternalEvent, Shop } = require('../models')

const { getLogger } = require('../utils/logger')

const log = getLogger('routes.printful')

module.exports = function (router) {
  /**
   * Makes an API call to Printful to get details about a specific order.
   */
  router.get(
    '/orders/:orderId/printful',
    authSellerAndShop,
    findOrder,
    async (req, res) => {
      const shopConfig = decryptConfig(req.shop.config)
      const apiKey = get(shopConfig, 'printful')
      const { statusCode, ...resp } = await fetchOrder(
        apiKey,
        req.params.orderId
      )

      return res.status(statusCode || 200).send(resp)
    }
  )

  router.post(
    '/orders/:orderId/printful/create',
    authSellerAndShop,
    async (req, res) => {
      const shopConfig = decryptConfig(req.shop.config)
      const apiKey = get(shopConfig, 'printful')
      const opts = { draft: req.body.draft }
      const { status, ...resp } = await placeOrder(apiKey, req.body, opts)

      return res.status(status || 200).send(resp)
    }
  )

  router.post(
    '/orders/:orderId/printful/confirm',
    authSellerAndShop,
    findOrder,
    async (req, res) => {
      const shopConfig = decryptConfig(req.shop.config)
      const apiKey = get(shopConfig, 'printful')
      const { status, ...resp } = await confirmOrder(apiKey, req.params.orderId)

      return res.status(status || 200).send(resp)
    }
  )

  router.post('/shipping', authShop, async (req, res) => {
    const shopConfig = decryptConfig(req.shop.config)
    const apiKey = get(shopConfig, 'printful')
    const result = await fetchShippingEstimate(apiKey, req.body)
    return res.json(result)
  })

  router.post('/printful/tax-rates', authShop, async (req, res) => {
    const shopConfig = decryptConfig(req.shop.config)
    const apiKey = get(shopConfig, 'printful')
    const result = await fetchTaxRates(apiKey, req.body)
    return res.json(result)
  })

  router.post('/printful/webhooks/:shopId/:secret', async (req, res) => {
    const { type, data } = req.body
    const { shopId, secret } = req.params

    try {
      const shop = await Shop.findOne({ where: { id: shopId } })
      const shopConfig = decryptConfig(shop.config)
      const storedSecret = get(shopConfig, 'printfulWebhookSecret')

      if (secret !== storedSecret) {
        log.error(
          `Shop ${shopId} - Invalid secret, ignoring Printful event`,
          type,
          data
        )
        return res.status(200).end()
      }
    } catch (err) {
      log.error(
        `Shop ${shopId} - Failed to validate Printful secret on request`,
        err
      )
      return res.status(500).end()
    }

    log.info(`Shop ${shopId} - Processing Printful event ${type}`)

    try {
      await ExternalEvent.create({
        shopId,
        service: 'printful',
        eventType: type,
        data: req.body
      })

      switch (type) {
        case PrintfulWebhookEvents.PackageShipped:
          await processShippedEvent(data, shopId)
          break

        case PrintfulWebhookEvents.ProductUpdated:
          await processUpdatedEvent(data, shopId)
          break

        default:
          log.info(`Shop ${shopId} - Ignored Printful event ${type}`)
      }
    } catch (err) {
      log.error(`Shop ${shopId} - Failed to process Printful event`, err)
    }

    return res.status(200).end()
  })
}
