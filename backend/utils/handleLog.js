require('dotenv').config()

const Web3 = require('web3')
const openpgp = require('openpgp')
const util = require('ethereumjs-util')

const Stripe = require('stripe')

const get = require('lodash/get')

const { getText, getIPFSGateway } = require('./_ipfs')
const abi = require('./_abi')
const { sendNewOrderEmail } = require('./emailer')
const { upsertEvent, getEventObj } = require('./events')
const { getConfig } = require('./encryptedConfig')
const discordWebhook = require('./discordWebhook')
const { Network, Order, Shop, ExternalPayment } = require('../models')
const { getLogger } = require('../utils/logger')

const log = getLogger('utils.handleLog')

const { validateDiscountOnOrder } = require('./discounts')

const web3 = new Web3()
const Marketplace = new web3.eth.Contract(abi)
const MarketplaceABI = Marketplace._jsonInterface

/**
 * Handles processing events emitted by the marketplace contract.
 *
 * @param {Object} web3: Web3 object
 * @param {Integer} networkId: Ethereum newtrok id
 * @param {string} contractVersion: Version of the marketplace contract. Ex: '001'
 * @param {Object} data: blockchain event data
 * @param {Array<Object>} topics: event topics
 * @param {string} transactionHash: blockchain transaction hash
 * @param {Integer} blockNumber: block number
 * @param {Function} mockGetEventObj: for testing only. Mock function to call to parse the event.
 * @returns {Promise<void>}
 */
const handleLog = async ({
  web3,
  networkId,
  contractVersion,
  address,
  data,
  topics,
  transactionHash,
  blockNumber,
  blockHash,
  mockGetEventObj,
  mockUpsert
}) => {
  const isTest = process.env.NODE_ENV === 'test'

  const eventAbi = MarketplaceABI.find((i) => i.signature === topics[0])
  if (!eventAbi) {
    log.warn('Unknown event')
    return
  }

  const rawEvent = {
    address,
    data,
    topics,
    transactionHash,
    blockNumber,
    blockHash
  }

  // Decorate the raw event with marketplace specific fields.
  const getEventObjFn =
    isTest && mockGetEventObj ? mockGetEventObj : getEventObj
  const eventObj = getEventObjFn(rawEvent)

  const listingId = `${networkId}-${contractVersion}-${eventObj.listingId}`
  log.info(`Event ${eventObj.eventName} for listing Id ${listingId}`)

  // The listener calls handleLog for any event emitted by the marketplace.
  // Skip processing any event that is not dshop related.
  const shop = await Shop.findOne({ where: { listingId } })
  if (!shop) {
    log.debug(`Event is not for a registered dshop. Skipping.`)
    return
  }

  // Persist the event in the database.
  const upsertEventFn = isTest && mockUpsert ? mockUpsert : upsertEvent
  const event = await upsertEventFn({
    web3,
    shopId: shop.id,
    networkId,
    event: rawEvent
  })

  // Process the order.
  await processDShopEvent({ event, shop })
}

/**
 * Processes a dshop event
 * @param {string} listingId: fully qualified listing id
 * @param {Event} event: Event DB model object.
 * @param {Shop} shop: Shop DB model object.
 * @param {boolean} skipEmail: do not send any email. Useful for ex. when
 *   reprocessing events, to avoid sending duplicate emails to the users.
 * @param {boolean} skipDiscord: do not call the Discord webhook. Useful
 *   for ex. when reprocessing events.
 * @returns {Promise<void>}
 */
async function processDShopEvent({ event, shop, skipEmail, skipDiscord }) {
  let data
  const eventName = event.eventName

  // Skip any event that is not offer related.
  if (eventName.indexOf('Offer') < 0) {
    log.debug(`Not offer related. Ignoring event ${eventName}`)
    return
  }

  const offerId = `${shop.listingId}-${event.offerId}`

  // Load the DB order associated with the blockchain offer.
  let order = await Order.findOne({
    where: {
      networkId: event.networkId,
      shopId: shop.id,
      orderId: offerId
    }
  })

  // If the order was already recorded, only update its status and we are done.
  if (order) {
    log.debug(`Updating status of DB order ${order.orderId} to ${eventName}`)

    const updatedFields = {
      statusStr: eventName,
      updatedBlock: event.blockNumber
    }

    let refundError

    if (eventName === 'OfferWithdrawn') {
      // Initiate payment refund
      const paymentMethod = get(order, 'data.paymentMethod.id')

      if (paymentMethod === 'stripe') {
        log.info('Trying to refund Stripe payment')
        try {
          // Load the shop configuration.
          const shopConfig = getConfig(shop.config)
          const { dataUrl } = shopConfig
          const ipfsGateway = await getIPFSGateway(dataUrl, event.networkId)
          log.info('IPFS Gateway', ipfsGateway)

          // Load the offer data to get the paymentCode
          const offerData = await getText(ipfsGateway, order.ipfsHash, 10000)
          const offer = JSON.parse(offerData)
          log.info('Payment Code', offer.paymentCode)

          const externalPayment = await ExternalPayment.findOne({
            where: {
              paymentCode: offer.paymentCode
            },
            attributes: ['payment_code', 'payment_intent']
          })

          const paymentIntent = externalPayment.get({ plain: true })
            .payment_intent

          log.info('Payment Intent', paymentIntent)

          const stripe = Stripe(shopConfig.stripeBackend)
          const piRefund = await stripe.refunds.create({
            payment_intent: paymentIntent
          })

          refundError = piRefund.reason

          if (!refundError) {
            log.info('Payment refunded')
          } else {
            log.info('Failed to refund payment', refundError)
          }
        } catch (err) {
          console.error(err)
          log.error('Failed to refund payment')
          refundError = 'Could not refund payment on Stripe'
        }
      }
    }

    updatedFields.data = {
      ...order.data,
      refundError
    }

    await order.update(updatedFields)

    return order
  }

  // At this point we expect the event to be an offer creation since no existing
  // order row was found in the DB.
  if (eventName !== 'OfferCreated') {
    log.error(
      `Error: got event ${eventName} offerId ${offerId} but no order found in the DB.`
    )
    return
  }

  log.info(`${eventName} - ${event.offerId} by ${event.party}`)
  log.info(`IPFS Hash: ${event.ipfsHash}`)

  const network = await Network.findOne({ where: { active: true } })
  const networkConfig = getConfig(network.config)

  try {
    // Load the shop configuration to read things like PGP key and IPFS gateway to use.
    const shopConfig = getConfig(shop.config)
    const { dataUrl, pgpPrivateKey, pgpPrivateKeyPass } = shopConfig
    const ipfsGateway = await getIPFSGateway(dataUrl, event.networkId)
    log.debug('IPFS Gateway', ipfsGateway)

    // Load the offer data. The main thing we are looking for is the IPFS hash
    // of the encrypted data.
    const offerData = await getText(ipfsGateway, event.ipfsHash, 10000)
    const offer = JSON.parse(offerData)
    log.debug('Offer:', offer)

    const encryptedHash = offer.encryptedData
    if (!encryptedHash) {
      throw new Error('No encrypted data found')
    }

    // Load the encrypted data from IPFS and decrypt it.
    const encryptedDataJson = await getText(ipfsGateway, encryptedHash, 10000)
    const encryptedData = JSON.parse(encryptedDataJson)

    const privateKey = await openpgp.key.readArmored(pgpPrivateKey)
    const privateKeyObj = privateKey.keys[0]
    await privateKeyObj.decrypt(pgpPrivateKeyPass)

    const message = await openpgp.message.readArmored(encryptedData.data)
    const options = { message, privateKeys: [privateKeyObj] }

    const plaintext = await openpgp.decrypt(options)
    data = JSON.parse(plaintext.data)
    data.offerId = offerId
    data.tx = event.transactionHash

    // Insert a new row in the orders DB table.
    const orderObj = {
      networkId: event.networkId,
      shopId: shop.id,
      orderId: offerId,
      data,
      statusStr: eventName,
      updatedBlock: event.blockNumber,
      createdAt: new Date(event.timestamp * 1000),
      createdBlock: event.blockNumber,
      ipfsHash: event.ipfsHash,
      encryptedIpfsHash: encryptedHash
    }
    if (data.referrer) {
      orderObj.referrer = util.toChecksumAddress(data.referrer)
      orderObj.commissionPending = Math.floor(data.subTotal / 200)
    }
    const { valid, error } = await validateDiscountOnOrder(orderObj, {
      markIfValid: true
    })
    if (!valid) {
      orderObj.data.error = error
    }
    order = await Order.create(orderObj)
    log.info(`Saved order ${order.orderId} to DB.`)
  } catch (e) {
    log.error(e)
    // Record the error in the DB.
    order = await Order.create({
      networkId: event.networkId,
      shopId: shop.id,
      orderId: offerId,
      statusStr: 'error',
      data: { error: e.message },
      updatedBlock: event.blockNumber,
      createdAt: new Date(event.timestamp * 1000),
      createdBlock: event.blockNumber,
      ipfsHash: event.ipfsHash
    })
    return order
  }

  // Send notifications via email and discord.
  if (!skipEmail) {
    await sendNewOrderEmail(shop.id, data)
  }
  if (!skipDiscord) {
    await discordWebhook({
      url: networkConfig.discordWebhook,
      orderId: offerId,
      shopName: shop.name,
      total: `$${(data.total / 100).toFixed(2)}`,
      items: data.items.map((i) => i.title).filter((t) => t)
    })
  }

  return order
}

module.exports = {
  handleLog,
  processDShopEvent
}
