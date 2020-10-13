const pick = require('lodash/pick')

const { authSellerAndShop } = require('./_auth')
const {
  Order,
  Transaction,
  sequelize,
  Sequelize: { Op }
} = require('../models')
const { findOrder } = require('../utils/orders')
const { updatePaymentStatus } = require('../logic/order')
const makeOffer = require('./_makeOffer')
const sendNewOrderEmail = require('../utils/emails/newOrder')

const safeAttributes = [
  'shopId',
  'paymentStatus',
  'paymentType',
  'paymentCode',
  'ipfsHash',
  'encryptedIpfsHash',
  'offerId',
  'offerStatus',
  'currency',
  'value',
  'data',
  'referrer',
  'createdAt'
]

/**
 * Sanitizes an order before it gets sent back to the front-end.
 * @param {model.Order} order
 * @return {object} sanitized order
 */
function sanitizeOrder(order) {
  // Pick attributes
  const result = pick(order, safeAttributes)
  // The orderId exposed to the front-end is the shortId and not the fqId since:
  //  - the fqId is much longer and harder to use by the buyer/merchant as a reference for a given order.
  //  - the fqId includes the shopId which is potentially a sensitive data.
  result.orderId = order.shortId
  return result
}

module.exports = function (router) {
  /**
   * Returns a page worth of orders for a shop. Supports searching for a specific order.
   *
   * The body of the request is expected to include:
   *   {integer} page: index of the page.
   *   {string} search: optional search query.
   */
  router.get('/orders', authSellerAndShop, async (req, res) => {
    const { page: pageVal, search } = req.query

    const page = parseInt(pageVal) || 1
    const limit = parseInt(process.env.ORDER_PAGINATION_LIMIT) || 50
    const offset = page ? (page - 1) * limit : undefined

    const where = {
      shopId: req.shop.id,
      archived: false
    }

    if (search) {
      // NOTE: Case-senstive when using sqlite
      // Should not be problem as it is only used during dev/testing
      // Could use sequelize.fn('lower') on the values if needed
      const isSqlite = sequelize.options.dialect === 'sqlite'
      const compareOp = isSqlite ? 'LIKE' : 'ILIKE'
      where[Op.or] = [
        sequelize.where(
          sequelize.cast(sequelize.col('data'), 'text'),
          compareOp,
          `%${search}%`
        )
      ]
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      order: [['createdAt', 'desc']],
      limit,
      offset
    })

    const numPages = Math.ceil(count / limit)

    const sanitizedOrders = orders.map((order) => sanitizeOrder(order))

    res.json({
      pagination: {
        numPages,
        totalCount: count,
        perPage: limit
      },
      orders: sanitizedOrders
    })
  })

  /**
   * Returns an order for a shop based on a shopId and a short order id.
   * The body of the request is expected to include:
   *   {string} orderId: short order id.
   */
  router.get(
    '/orders/:orderId',
    authSellerAndShop,
    findOrder,
    async (req, res) => {
      // Load transactions associated with the order.
      let transactions = []
      if (req.order.paymentCode) {
        transactions = await Transaction.findAll({
          where: {
            customId: req.order.paymentCode
          }
        })
      }

      // For pagination purposes, load the prev and next orders, if any.
      const prevOrder = await Order.findOne({
        where: {
          shopId: req.order.shopId,
          id: { [Op.lt]: req.order.id },
          archived: false
        },
        order: [['id', 'desc']]
      })
      const nextOrder = await Order.findOne({
        where: {
          shopId: req.order.shopId,
          id: { [Op.gt]: req.order.id },
          archived: false
        },
        order: [['id', 'asc']]
      })

      const sanitizedOrder = sanitizeOrder(req.order)

      res.json({
        ...sanitizedOrder,
        transactions,
        prevOrderId: prevOrder ? prevOrder.shortId : null,
        nextOrderId: nextOrder ? nextOrder.shortId : null
      })
    }
  )

  /**
   * Sends emails to the buyer and merchant about a new order on a shop.
   * This is called by the shop console when reprocessing an order manually.
   *
   * The body of the request is expected to include:
   *   {string} orderId: short order id.
   */
  router.post(
    '/orders/:orderId/email',
    authSellerAndShop,
    findOrder,
    async (req, res) => {
      try {
        await sendNewOrderEmail({
          orderId: req.params.orderId,
          order: req.order,
          shop: req.shop,
          cart: JSON.parse(req.order.data)
        })
        res.json({ success: true })
      } catch (e) {
        res.json({ success: false })
      }
    }
  )

  router.post(
    '/orders/create',
    authSellerAndShop,
    (req, res, next) => {
      const { encryptedData } = req.body
      if (!encryptedData) {
        return res.json({ success: false })
      }
      req.body.data = encryptedData
      req.amount = 0
      next()
    },
    makeOffer
  )

  /**
   * To update the payment state of an order
   *
   * @param {String} paymentCode the custom ID of the external payment
   * @param {enums.OrderPaymentStatuses} state new payment state to set
   */
  router.put(
    '/orders/:orderId/payment-state',
    authSellerAndShop,
    findOrder,
    async (req, res) => {
      const { state } = req.body
      const { order, shop } = req

      res.status(200).send(await updatePaymentStatus(order, state, shop))
    }
  )
}
