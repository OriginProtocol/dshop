const { authSellerAndShop, authShop } = require('./_auth')
const {
  Order,
  Transaction,
  sequelize,
  Sequelize: { Op }
} = require('../models')
const { findOrder } = require('../utils/orders')
const makeOffer = require('./_makeOffer')
const sendNewOrderEmail = require('../utils/emails/newOrder')

module.exports = function (router) {
  router.get('/orders', authSellerAndShop, async (req, res) => {
    const { page: pageVal, search } = req.query

    const page = parseInt(pageVal) || 1
    const limit = parseInt(process.env.ORDER_PAGINATION_LIMIT) || 50
    const offset = page ? (page - 1) * limit : undefined

    const where = {
      shopId: req.shop.id
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

    res.json({
      pagination: {
        numPages,
        totalCount: count,
        perPage: limit
      },
      orders
    })
  })

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
          createdAt: { [Op.lt]: req.order.createdAt }
        },
        order: [['createdAt', 'desc']]
      })
      const nextOrder = await Order.findOne({
        where: {
          shopId: req.order.shopId,
          createdAt: { [Op.gt]: req.order.createdAt }
        },
        order: [['createdAt', 'asc']]
      })

      res.json({
        ...req.order.dataValues,
        transactions,
        prevOrderId: prevOrder ? prevOrder.orderId : null,
        nextOrderId: nextOrder ? nextOrder.orderId : null
      })
    }
  )

  router.post(
    '/orders/:orderId/email',
    authSellerAndShop,
    findOrder,
    async (req, res) => {
      try {
        await sendNewOrderEmail({
          orderId: req.params.orderId,
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

  router.post(
    '/orders/offline-payment-order',
    authShop,
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
}
