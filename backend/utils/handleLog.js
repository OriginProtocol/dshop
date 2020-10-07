require('dotenv').config()

const fs = require('fs')
const Web3 = require('web3')

const set = require('lodash/set')

const { OrderPaymentStatuses } = require('../enums')
const { getText, getIPFSGateway } = require('./_ipfs')
const abi = require('./_abi')
const { upsertEvent, getEventObj } = require('./events')
const { getConfig } = require('./encryptedConfig')
const { Network, Order, Shop } = require('../models')
const { getLogger } = require('../utils/logger')
const { ListingID } = require('./id')
const { processNewOrder, updatePaymentStatus } = require('../logic/order')

const log = getLogger('utils.handleLog')

const { DSHOP_CACHE } = require('../utils/const')

const IPFS_TIMEOUT = 60000 // 60sec in msec

const web3 = new Web3()
const Marketplace = new web3.eth.Contract(abi)
const MarketplaceABI = Marketplace._jsonInterface

/**
 * Handles processing events emitted by the marketplace contract.
 *
 * @param {Integer} networkId: Ethereum network id
 * @param {string} contractVersion: Version of the marketplace contract. Ex: '001'
 * @param {Object} data: blockchain event data
 * @param {Array<Object>} topics: event topics
 * @param {string} transactionHash: blockchain transaction hash
 * @param {Integer} blockNumber: block number
 * @param {Function} mockGetEventObj: for testing only. Mock function to call to parse the event.
 * @returns {Promise<void>}
 * @throws {Error}
 */
async function handleLog({
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
}) {
  const isTest = process.env.NODE_ENV === 'test'

  const network = await Network.findOne({ where: { networkId } })
  web3.setProvider(network.provider)

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
  log.info(`Received event ${eventObj.eventName} for listing ${listingId}`)

  // Lookup the Dshop associated with the event, if any.
  const shop = await Shop.findOne({ where: { listingId } })
  const shopId = shop ? shop.id : null

  // Note: we persist all marketplace events in the DB, not only dshop related ones.
  // This is to facilitate troubleshooting.
  const upsertEventFn = isTest && mockUpsert ? mockUpsert : upsertEvent
  const event = await upsertEventFn({
    web3,
    shopId,
    networkId,
    event: rawEvent
  })

  log.info(
    `Processing event ${eventObj.eventName} on listing ${listingId} for shop ${shopId}`
  )
  await processDShopEvent({ event, shop })
}

/**
 * Processes a blockchain event for an order already recorded in the system.
 *
 * TODO:
 *  - This method assumes blockchain events are always processed in order.
 * We should add safeguards based on the current status of the order before
 * running any logic and updating the status.
 *  - As opposed to updating the order row, it would be better to consider the
 *  orders table as append-only and insert a new row every time an order is
 *  updated. This way we would have an auditable log of the changes.
 *
 * @param {models.Event} event: Event DB object.
 * @param {models.Order} order: Order DB object.
 * @returns {Promise<models.Order>} The updated order.
 * @throws {Error}
 * @private
 */
async function _processEventForExistingOrder({ event, shop, order }) {
  const eventName = event.eventName

  const updatedFields = {
    offerStatus: eventName,
    updatedBlock: event.blockNumber
  }

  if (eventName === 'OfferWithdrawn') {
    await updatePaymentStatus(order, OrderPaymentStatuses.Refunded, shop)
  }

  // Update the order in the DB and return it.
  await order.update(updatedFields)
  return order
}

/**
 * Processes a blockchain event for a new order that has not been recorded yet in the system.
 *
 * @param {models.Event} event: Event DB object.
 * @param {string} offerId: fully qualified offer id.
 * @param {models.Shop} shop: Shop DB object.
 * @param {boolean} skipEmail: whether to skip sending a notification email to the merchant and buyer.
 * @param {boolean} skipDiscord: whether to skip sending a discord notification.
 * @returns {Promise<models.Order>} Newly created order.
 * @throws {Error}
 * @private
 */
async function _processEventForNewOrder({
  event,
  offerId,
  shop,
  skipEmail,
  skipDiscord
}) {
  const eventName = event.eventName

  // We expect the event to be an offer creation.
  if (eventName !== 'OfferCreated') {
    throw new Error(`Unexpected event ${eventName} for offerId ${offerId}.`)
  }
  log.info(`${eventName} - ${event.offerId} by ${event.party}`)
  log.info(`IPFS Hash: ${event.ipfsHash}`)

  const network = await Network.findOne({ where: { active: true } })
  if (network.networkId !== event.networkId) {
    throw new Error(`Could not find active network ${event.networkId}`)
  }
  const networkConfig = getConfig(network.config)

  // Load the shop configuration to read things like IPFS gateway to use.
  const shopConfig = getConfig(shop.config)
  const { dataUrl } = shopConfig
  const ipfsGateway = await getIPFSGateway(dataUrl, network.networkId)
  log.info(`Using IPFS gateway ${ipfsGateway} for fetching offer data`)

  // Load the offer data. The main thing we are looking for is the IPFS hash
  // of the encrypted data.
  log.info(`Fetching offer data with hash ${event.ipfsHash}`)
  const offerIpfsHash = event.ipfsHash
  const offerData = await getText(ipfsGateway, offerIpfsHash, IPFS_TIMEOUT)
  const offer = JSON.parse(offerData)
  log.debug('Offer:', offer)

  // Load the encrypted data.
  const encryptedHash = offer.encryptedData
  if (!encryptedHash) {
    throw new Error('No encrypted data found')
  }
  log.info(`Fetching encrypted offer data with hash ${encryptedHash}`)

  const order = await processNewOrder({
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
  })
  return order
}

/**
 * Logic for processing ListingCreated event.
 *
 * @param {models.Event} event
 * @returns {Promise<null||models.Shop>}
 * @private
 */
async function _processEventListingCreated({ event }) {
  // Get the address of the wallet that submitted the event.
  const walletAddress = event.party

  // Lookup for any shop linked to that address and that does not have a listingId yet.
  // There could be more than one if the merchant created multiple shops
  // using the same wallet. We pick the most recently updated shop.
  const shop = await Shop.findOne({
    where: { walletAddress, listingId: null },
    order: [['updatedAt', 'desc']]
  })
  if (!shop) {
    // Ignore the event. It could be a ListingCreated event unrelated to Dshop
    // or a merchant that submitted by mistake multiple createListing transactions.
    log.info(`No shop found associated with wallet address ${walletAddress}`)
    return null
  }

  // Get the fully-qualified listing ID.
  const listingId = new ListingID(event.listingId, shop.networkId).toString()

  // Associate the listing Id with the shop in the DB.
  await shop.update({ listingId })
  log.info(`Associated shop ${shop.id} with listing Id ${listingId}`)

  // Load the shop's config.json from the deploy staging area.
  const dataDir = shop.authToken
  const shopDir = `${DSHOP_CACHE}/${dataDir}`
  const shopConfigPath = `${shopDir}/data/config.json`
  log.debug(`Shop ${shop.id}: Loading config at ${shopConfigPath}`)
  const raw = fs.readFileSync(shopConfigPath)
  const shopConfig = JSON.parse(raw.toString())

  // Update the config.json listingId field and write it back to disk.
  const netPath = `networks[${shop.networkId}]`
  set(shopConfig, `${netPath}.listingId`, listingId)
  fs.writeFileSync(shopConfigPath, JSON.stringify(shopConfig, null, 2))
  log.info(
    `Shop ${shop.id}: set listingId to ${listingId} in config at ${shopConfigPath}`
  )

  return shop
}

/**
 * Processes a dshop event
 * @param {string} listingId: fully qualified listing id
 * @param {models.Event} event: Event DB object.
 * @param {models.Shop} shop: Shop DB object or null.
 * @param {boolean} skipEmail: do not send any email. Useful for ex. when
 *   reprocessing events, to avoid sending duplicate emails to the users.
 * @param {boolean} skipDiscord: do not call the Discord webhook. Useful
 *   for ex. when reprocessing events.
 * @returns {Promise<models.Shop|models.Order|null} Shop or Order DB object or null if the event did not
 *   Null in case the event did not need to get processed.
 */
async function processDShopEvent({ event, shop, skipEmail, skipDiscord }) {
  const eventName = event.eventName

  if (eventName === 'ListingCreated') {
    const shop = await _processEventListingCreated({ event })
    return shop
  }

  // Skip any event that is not offer related.
  if (eventName.indexOf('Offer') < 0) {
    log.info(
      `Not a ListingCreated neither an Offer event. Ignoring ${eventName}`
    )
    return null
  }

  // If it's an Offer event, we expect a shop to have been loaded and we expect
  // the shop to have a listingId.
  if (!shop) {
    log.info(`No shop associated with event ${eventName}. Skipping.`)
    return
  }
  if (!shop.listingId) {
    throw new Error(
      `No listingId associated with shop ${shop.id}. Processing of event ${eventName} failed.`
    )
  }

  // Construct a fully-qualified offerId.
  const offerId = `${shop.listingId}-${event.offerId}`

  // Load any existing order associated with this blockchain offer.
  let order = await Order.findOne({
    where: {
      networkId: event.networkId,
      shopId: shop.id,
      offerId
    }
  })

  if (order) {
    // Existing order.
    order = await _processEventForExistingOrder({ event, shop, order })
  } else {
    // New order.
    order = await _processEventForNewOrder({
      event,
      offerId,
      shop,
      skipEmail,
      skipDiscord
    })
  }

  return order
}

module.exports = {
  handleLog,
  processDShopEvent
}
