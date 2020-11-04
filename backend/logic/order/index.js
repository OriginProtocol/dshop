const randomstring = require('randomstring')
const util = require('ethereumjs-util')
const get = require('lodash/get')

const { OrderPaymentStatuses, OrderPaymentTypes } = require('../../enums')
const { Sentry } = require('../../sentry')
const { Order, Product } = require('../../models')
const sendNewOrderEmail = require('../../utils/emails/newOrder')
const discordWebhook = require('../../utils/discordWebhook')
const { autoFulfillOrder } = require('../printful')
const { decryptShopOfferData } = require('../../utils/offer')
const { getLogger } = require('../../utils/logger')

const { validateDiscountOnOrder } = require('../discount')
const { processStripeRefund } = require('../payments/stripe')
const { processPayPalRefund } = require('../payments/paypal')
const { getConfig } = require('../../utils/encryptedConfig')

const log = getLogger('logic.order')

/**
 * Returns a new order id. Returns its full-qualified and short form.
 * Format: <networkId>-<contractVersion>-<listingId>-<shopID>-<randomId>.
 * Example: 1-001-12345-6789-XCQ69BTJ
 *
 * @param {models.Network} network
 * @param {models.Shop} shop
 * @returns {fqId: string, shortId: string}
 */
function createOrderId(network, shop) {
  const shortId = randomstring.generate({
    readable: true,
    charset: 'alphanumeric',
    capitalization: 'uppercase',
    length: 8
  })
  // Note: network.listingId is fully qualified and has format <networkId>-<contractVersion>-<listingId>.
  const fqId = `${network.listingId}-${shop.id}-${shortId}`
  return { fqId, shortId }
}

/**
 * Returns the short version of an order id, which is an 8 characters long alphanumerical id.
 * It is the preferred form to use in external communication with merchants and buyers.
 *
 * @param {string} fqOrderId: a fully qualified order id.
 */
function getShortOrderId(fqOrderId) {
  const parts = fqOrderId.split('-')
  if (parts.length !== 5) {
    throw new Error(`Invalid order id ${fqOrderId}`)
  }
  const shortOrderId = parts[4]
  if (shortOrderId.length !== 8) {
    throw new Error(`Invalid order id ${fqOrderId}`)
  }
  return shortOrderId
}

/**
 * Utility method to extract the payment type from the encrypted offer data.
 * @param {object} offerData
 * @returns {enums.OrderPaymentTypes}
 */
function getPaymentType(offerData) {
  const paymentMethodId = get(offerData, 'paymentMethod.id')
  let paymentType
  switch (paymentMethodId) {
    case 'crypto':
      paymentType = OrderPaymentTypes.CryptoCurrency
      break
    case 'stripe':
      paymentType = OrderPaymentTypes.Stripe
      break
    case 'paypal':
      paymentType = OrderPaymentTypes.PayPal
      break
    case 'uphold':
      paymentType = OrderPaymentTypes.Uphold
      break
    default:
      paymentType = OrderPaymentTypes.Offline
  }
  return paymentType
}

/**
 * Logic for creating a new order in the system.
 *
 * @param {models.Network} network
 * @param {object} networkConfig
 * @param {models.Shop} shop
 * @param {object} shopConfig
 * @param {object} offer: JSON of the unencrypted offer data.
 * @param {string} offerIpfsHash: IPFS hash of the unencrypted offer data.
 * @param {string || null} offerId: blockchain fully-qualified offer ID or null in case of an off-chain offer.
 * @param {object || null} event: blockchain OfferCreated event or null in case of an off-chain offer.
 * @param {boolean} skipEmail: If true, do not send email to the buyer/seller.
 * @param {boolean} skipDiscord: If true, do not send Discord notification to the system administrator.
 * @param {enums.OrderPaymentTypes} paymentType: Optional. Payment type of the order.
 *   It is not passed for on-chain transactions and in that case the logic gets the
 *   paymentType by inspecting the encrypted offer data.
 * @param {enums.OrderPaymentStatuses} paymentStatus: Payment status override
 * @returns {Promise<models.Order>}
 */
async function processNewOrder({
  network,
  networkConfig,
  shop,
  shopConfig,
  offer,
  offerIpfsHash,
  offerId,
  event,
  skipEmail,
  skipDiscord,
  paymentType,
  paymentStatus: _paymentStatus
}) {
  // Generate a short unique order id and the fully qualified id.
  const { fqId, shortId } = createOrderId(network, shop)

  // Load the encrypted data from IPFS and decrypt it.
  const encryptedHash = offer.encryptedData
  if (!encryptedHash) {
    throw new Error('No encrypted data found')
  }
  log.info(`Fetching encrypted offer data with hash ${encryptedHash}`)
  const data = await decryptShopOfferData(shop, encryptedHash)

  // On-chain marketplace transactions do not pass the paymentType. Extract it from the offer data.
  if (offerId) {
    paymentType = getPaymentType(data)
  }

  // Decorate the data with additional blockchain specific info before storing it in the DB.
  if (event) {
    data.tx = event.transactionHash
  }

  // Extract the optional paymentCode data from the offer.
  // It is populated for example in case of a Credit Card payment.
  const paymentCode = offer.paymentCode || null

  // Let the status be `Pending` by default for Offline payments.
  const paymentStatus =
    _paymentStatus ||
    (paymentType === OrderPaymentTypes.Offline
      ? OrderPaymentStatuses.Pending
      : OrderPaymentStatuses.Paid)

  // Insert a new row in the orders DB table.
  const orderObj = {
    networkId: network.networkId,
    shopId: shop.id,
    fqId,
    shortId,
    data,
    paymentStatus,
    paymentType,
    paymentCode,
    ipfsHash: offerIpfsHash,
    encryptedIpfsHash: encryptedHash,
    total: data.total,
    currency: data.currency
  }
  if (event) {
    // Offer was created on-chain. Record blockchain specific data from the event.
    orderObj.offerId = offerId
    orderObj.offerStatus = event.eventName
    orderObj.createdAt = new Date(event.timestamp * 1000)
    orderObj.createdBlock = event.blockNumber
    orderObj.updatedBlock = event.blockNumber
  } else {
    // Offer was created off-chain.
    orderObj.createdAt = new Date()
  }
  if (data.referrer) {
    orderObj.referrer = util.toChecksumAddress(data.referrer)
    orderObj.commissionPending = Math.floor(data.subTotal / 200)
  }
  orderObj.data.error = []

  //
  // Discount and inventory validation steps.
  //
  // Note: If there is an error (ex: item out of stock, unavail discount, ...)
  // we store the error in the order data but we don't throw. The reason
  // is that order processing is asynchronous. The buyer already exited
  // checkout successfully. So we record the order with errors in the DB
  // and letthe merchant decide if they want to refund the buyer.
  const discountResult = await validateDiscountOnOrder(orderObj)
  if (!discountResult.valid) {
    const discountError = discountResult.error
    orderObj.data.discountError = discountError
    orderObj.data.error.push(discountError)
  }

  const inventoryResult = await updateInventoryData(shop, shopConfig, data)
  if (!inventoryResult.success) {
    const inventoryError = inventoryResult.error
    orderObj.data.inventoryError = inventoryError
    orderObj.data.error.push(inventoryError)
  }

  // Create the order in the DB.
  const order = await Order.create(orderObj)
  log.info(`Saved order ${order.fqId} to DB.`)

  // Note: we only fulfill the order if the payment status is 'Paid'.
  // If the payment is still pending, the order will get fulfilled
  // at the time the payment status gets updated to 'Paid' (for ex. when the
  // merchant marks the payment as received for the order via the admin tool.
  // TODO:
  //  - Move order fulfillment to a queue.
  //  - Should we still auto-fulfill in case of an error in inventory or discount validation?
  if (
    shopConfig.printful &&
    shopConfig.printfulAutoFulfill &&
    paymentStatus === OrderPaymentStatuses.Paid
  ) {
    await autoFulfillOrder(order, shopConfig, shop)
  }

  // Send notifications via email and discord.
  // This section is not critical so we log errors but do not throw any
  // exception in order to avoid triggering a queue retry which would
  // cause the order to get recorded multiple times in the DB.
  if (!skipEmail) {
    try {
      await sendNewOrderEmail({
        orderId: shortId,
        order,
        shop,
        cart: data,
        network
      })
    } catch (e) {
      log.error('Email sending failure:', e)
      Sentry.captureException(e)
    }
  }
  if (!skipDiscord) {
    try {
      await discordWebhook({
        url: networkConfig.discordWebhook,
        orderId: fqId,
        shopName: shop.name,
        total: `${(data.total / 100).toFixed(2)} ${data.currency}`,
        items: data.items.map((i) => i.title).filter((t) => t)
      })
    } catch (e) {
      log.error('Discord webhook failure:', e)
      Sentry.captureException(e)
    }
  }

  return order
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
 * Returns the validity of the payment state
 * transition on an order
 * @param {model.Order} order
 * @param {enums.OrderPaymentStatuses} newState
 *
 * @returns {Boolean} true if valid
 */
const isValidTransition = function (order, newState) {
  return get(
    validPaymentStateTransitions,
    order.paymentStatus,
    validPaymentStateTransitions[OrderPaymentStatuses.Pending]
  ).includes(newState)
}

/**
 * Updates the payment state of an order
 * @param {model.Order} order
 * @param {enums.OrderPaymentStatuses} newState
 * @param {mode.Shop} shop
 *
 * @returns {{
 *  success {Boolean}
 *  reason {String|null} error message if any
 * }}
 */
async function updatePaymentStatus(order, newState, shop) {
  if (order.paymentStatus === newState) {
    // No change, Ignore
    return { success: true }
  }

  if (!isValidTransition(order, newState)) {
    return {
      reason: `Cannot change payment state from ${order.paymentStatus} to ${newState}`
    }
  }

  const shopConfig = getConfig(shop.config)

  let refundError = get(order, 'data.refundError')
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
  } else if (newState === OrderPaymentStatuses.Paid) {
    if (shopConfig.printful && shopConfig.printfulAutoFulfill) {
      await autoFulfillOrder(order, shopConfig, shop)
    }
  }

  const shouldUpdateInventory =
    shopConfig.inventory &&
    !order.data.inventoryError &&
    [
      OrderPaymentStatuses.Refunded,
      OrderPaymentStatuses.Rejected,
      OrderPaymentStatuses.Paid
    ].includes(newState)

  let inventoryError
  if (shouldUpdateInventory) {
    const { error } = await updateInventoryData(
      shop,
      shopConfig,
      order.data,
      newState !== OrderPaymentStatuses.Paid
    )
    inventoryError = error
  }

  await order.update({
    paymentStatus: newState,
    data: {
      ...order.data,
      refundError,
      inventoryError
    }
  })

  return { success: !refundError, reason: refundError }
}

/**
 * Marks and processes a deferred payment, used for
 * PayPal eCheck payments
 *
 * @param {String} paymentCode external payment ID, used to find order
 * @param {enums.OrderPaymentTypes} paymentType
 * @param {model.Shop} shop
 * @param {Object} event the webhook event
 *
 * @returns {Boolean} true if existing order has been marked as paid
 */
async function processDeferredPayment(paymentCode, paymentType, shop, event) {
  // Check if it is an existing pending order
  const order = await Order.findOne({
    where: {
      paymentCode,
      paymentType,
      shopId: shop.id,
      paymentStatus: OrderPaymentStatuses.Pending
    }
  })

  const shopId = shop.id

  if (order) {
    // If yes, mark it as Paid, instead of
    // creating a new order.

    const { success, reason } = await updatePaymentStatus(
      order,
      OrderPaymentStatuses.Paid,
      shop
    )

    if (!success) {
      const error = new Error(`[Shop ${shopId}] ${reason}`)
      Sentry.captureException(error)

      throw error
    }

    log.info(
      `[Shop ${shopId}] Marking order ${order.id} as paid w.r.t. event ${event}`
    )

    return true
  }

  return false
}

/**
 * Updates the availability of the products after a new order
 * or an order cancelation
 *
 * @param {model.Shop} shop
 * @param {Object} shopConfig Shop's decrypted config
 * @param {Object} cartData Cart data
 * @param {Boolean} increment Adds to the quantity instead of decreasing, to be used when cancelling/rejecting
 *
 * @returns {{
 *  success,
 *  error
 * }}
 */
async function updateInventoryData(
  shop,
  shopConfig,
  cartData,
  increment = false
) {
  // Nothing to do if inventory management is not enabled for the shop.
  if (!shopConfig.inventory) {
    return { success: true }
  }

  const quantModifier = increment ? 1 : -1

  const cartItems = get(cartData, 'items', [])
  const dbProducts = await Product.findAll({
    where: {
      shopId: shop.id,
      productId: cartItems.map((item) => item.product)
    }
  })

  const allValidProducts = cartItems.every(
    (item) => !!dbProducts.find((product) => product.productId === item.product)
  )

  if (!allValidProducts) {
    log.error(`[Shop ${shop.id}] Invalid product ID`, cartItems)
    return {
      error: 'Some products in this order are unavailable'
    }
  }

  for (const product of dbProducts) {
    const allItems = cartItems.filter(
      (item) => item.product === product.productId
    )
    for (const item of allItems) {
      const variantId = get(item, 'variant')

      if (variantId == null) {
        log.error(
          `[Shop ${shop.id}] Invalid variant ID`,
          product.productId,
          variantId
        )
        return {
          error: 'Some products in this order are unavailable'
        }
      }

      const quant = quantModifier * item.quantity

      const variantStock = product.variantsStock[variantId] + quant
      const productStock = product.stockLeft + quant

      if (!increment && (productStock < 0 || variantStock < 0)) {
        log.error(
          `[Shop ${shop.id}] Product has insufficient stock`,
          product.productId,
          variantId
        )
        return {
          error: 'Some products in this order are out of stock'
        }
      }

      log.debug(
        `Updating stock of product ${product.productId} to ${productStock} and variant ${variantId} to ${variantStock}`
      )

      await product.update({
        stockLeft: productStock,
        variantsStock: {
          ...product.variantsStock,
          [variantId]: variantStock
        }
      })
    }
  }

  log.info(`Updated inventory.`)

  return {
    success: true
  }
}

module.exports = {
  createOrderId,
  getShortOrderId,
  processNewOrder,
  processDeferredPayment,
  isValidTransition,
  updatePaymentStatus
}
