const { authSellerAndShop } = require('./_auth')
const {
  Order,
  sequelize,
  Sequelize: { Op }
} = require('../models')
const { findOrder } = require('../utils/orders')
const makeOffer = require('./_makeOffer')
const { sendNewOrderEmail } = require('../utils/emailer')

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
      order: [
        [
          // NOTE: Order.orderId is of the format xxxx-yyy-zz-aa
          // Split the text on '-' and take the last component
          // Cast it to number and sort by that value
          // Expensive Operation, should probably replace it with
          // just ['createdAt', 'desc'] if this turns out to be bottleneck
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

  router.get('/orders/:orderId', authSellerAndShop, findOrder, (req, res) => {
    res.json(req.order)
  })

  router.post(
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
}
