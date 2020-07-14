const { authSellerAndShop } = require('./_auth')
const { Order } = require('../models')
const { findOrder } = require('../utils/orders')
const makeOffer = require('./_makeOffer')
const { sendNewOrderEmail } = require('../utils/emailer')

module.exports = function (router) {
  router.get('/orders', authSellerAndShop, async (req, res) => {
    const orders = await Order.findAll({
      where: { shopId: req.shop.id },
      order: [['createdAt', 'desc']]
    })
    res.json(orders)
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
