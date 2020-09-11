const randomstring = require('randomstring')
const util = require('ethereumjs-util')

const { OrderPaymentStatuses } = require('../../enums')
const { Sentry } = require('../../sentry')
const { Order } = require('../../models')
const sendNewOrderEmail = require('../../utils/emails/newOrder')
const discordWebhook = require('../../utils/discordWebhook')
const { autoFulfillOrder } = require('../../utils/printful')
const { decryptShopOfferData } = require('../../utils/offer')
const { validateDiscountOnOrder } = require('../../utils/discounts')
const { getLogger } = require('../../utils/logger')

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
  skipDiscord
}) {
  // Generate a short unique order id.
  const { fqId, shortId } = createOrderId(network, shop)

  // Generate the fully qualified id.

  // Load the encrypted data from IPFS and decrypt it.
  const encryptedHash = offer.encryptedData
  if (!encryptedHash) {
    throw new Error('No encrypted data found')
  }
  log.info(`Fetching encrypted offer data with hash ${encryptedHash}`)
  const data = await decryptShopOfferData(shop, encryptedHash)

  // Decorate the data with additional blockchain specific info before storing it in the DB.
  if (event) {
    data.tx = event.transactionHash
  }

  // Extract the optional paymentCode data from the offer.
  // It is populated for example in case of a Credit Card payment.
  const paymentCode = offer.paymentCode || null

  // Insert a new row in the orders DB table.
  const orderObj = {
    networkId: network.networkId,
    shopId: shop.id,
    fqId,
    shortId,
    data,
    paymentStatus: OrderPaymentStatuses.Paid,
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

  // Validate any discount applied to the order.
  // TODO: in case the discount fails validation, consider rejecting the order
  //       and setting its status to "Invalid".
  const { valid, error } = await validateDiscountOnOrder(orderObj, {
    markIfValid: true
  })
  if (!valid) {
    orderObj.data.error = error
  }

  // Create the order in the DB.
  const order = await Order.create(orderObj)
  log.info(`Saved order ${order.fqId} to DB.`)

  // TODO: move order fulfillment to a queue.
  if (shopConfig.printful && shopConfig.printfulAutoFulfill) {
    await autoFulfillOrder(order, shopConfig, shop)
  }

  // Send notifications via email and discord.
  // This section is not critical so we log errors but do not throw any
  // exception in order to avoid triggering a queue retry which would
  // cause the order to get recorded multiple times in the DB.
  if (!skipEmail) {
    try {
      await sendNewOrderEmail({ orderId: shortId, shop, cart: data, network })
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

module.exports = {
  createOrderId,
  getShortOrderId,
  processNewOrder
}
