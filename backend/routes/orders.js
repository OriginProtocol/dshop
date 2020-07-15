const { authSellerAndShop } = require('./_auth')
const {
  Order,
  sequelize,
  Sequelize: { Op }
} = require('../models')
const { findOrder } = require('../utils/orders')
const makeOffer = require('./_makeOffer')
const { sendNewOrderEmail } = require('../utils/emailer')

module.exports = function (app) {
  app.get('/orders', authSellerAndShop, async (req, res) => {
    const { page: pageVal, search } = req.query

    const page = parseInt(pageVal) || 1
    const limit = parseInt(process.env.ORDER_PAGINATION_LIMIT) || 50
    const offset = page ? (page - 1) * limit : undefined

    const where = {
      shopId: req.shop.id
    }

    if (search) {
      where[Op.or] = [
        sequelize.where(
          sequelize.cast(sequelize.col('data'), 'text'),
          'ILIKE',
          `%${search}%`
        )
      ]
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      order: [
        // ['createdAt', 'desc'],
        [
          sequelize.cast(
            sequelize.fn('split_part', sequelize.col('order_id'), '-', 4),
            'numeric'
          ),
          'desc'
        ]
      ],
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

  app.get('/orders/:orderId', authSellerAndShop, findOrder, (req, res) => {
    res.json(req.order)
  })

  app.post(
    '/orders/:orderId/email',
    authSellerAndShop,
    findOrder,
    async (req, res) => {
      try {
        await sendNewOrderEmail(req.shop, JSON.parse(req.order.data))
        res.json({ success: true })
      } catch (e) {
        res.json({ success: false })
      }
    }
  )

  app.post(
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
}
