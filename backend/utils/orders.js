const get = require('lodash/get')

const { OrderPaymentStatuses, OrderPaymentTypes } = require('../enums')
const { Order } = require('../models')
const { processStripeRefund } = require('./stripe')
const { processPayPalRefund } = require('./paypal')

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

const validPaymentStateTransitions = {
  [OrderPaymentStatuses.Refunded]: [],
  [OrderPaymentStatuses.Rejected]: [],
  [OrderPaymentStatuses.Pending]: [
    OrderPaymentStatuses.Paid,
    OrderPaymentStatuses.Rejected,
    OrderPaymentStatuses.Refunded
  ],
  [OrderPaymentStatuses.Paid]: [OrderPaymentStatuses.Refunded]
}

/**
 * Updates the payment state of an order
 * @param {model.Order} order
 * @param {enums.OrderPaymentStatuses} newState
 * @param {mode.Shop} shop
 */
async function updatePaymentStatus(order, newState, shop) {
  if (order.paymentStatus === newState) {
    // No change, Ignore
    return { success: true }
  }

  const isValid = get(
    validPaymentStateTransitions,
    order.paymentStatus,
    validPaymentStateTransitions[OrderPaymentStatuses.Pending]
  ).includes(newState)

  if (!isValid) {
    return {
      reason: `Cannot change payment state from ${order.paymentStatus} to ${newState}`
    }
  }

  let refundError = null
  if (newState === OrderPaymentStatuses.Refunded) {
    // Initiate a refund in case of Stripe and PayPal
    switch (order.paymentType) {
      case OrderPaymentTypes.CreditCard:
        refundError = await processStripeRefund({ shop, order })
        break
      case OrderPaymentTypes.PayPal:
        refundError = await processPayPalRefund({ shop, order })
        break
    }
  }

  await order.update({
    paymentStatus: newState,
    data: {
      ...order.data,
      refundError
    }
  })

  return { success: !refundError, reason: refundError }
}

module.exports = { findOrder, updatePaymentStatus }
