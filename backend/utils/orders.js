const { Order } = require('../models')

/**
 * Middleware to lookup an order.
 * Decorates the request with the order or returns a 404 if not found.
 *
 * @param {string} req.params.orderId: short form order Id
 * @param {model.Shop} req.params.orderId: short order Id
 */
async function findOrder(req, res, next) {
  const { orderId } = req.params

  // Lookup the order by either shortId (new style) or offerId (may still be used by external systems
  // such as Printful for referring to legacy orders).
  const order = await Order.findOne({
    where: {
      shopId: req.shop.id,
      shortId: orderId
    }
  })

  if (!order) {
    return res.status(404).send({ success: false })
  }

  // Decorate the request with the order object.
  req.order = order

  // Call the next middleware.
  next()
}

module.exports = { findOrder }
