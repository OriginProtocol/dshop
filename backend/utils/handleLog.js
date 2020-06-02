require('dotenv').config()

const Web3 = require('web3')
const openpgp = require('openpgp')

const { getText, getIPFSGateway } = require('./_ipfs')
const abi = require('./_abi')
const sendMail = require('./emailer')
const { upsertEvent, getEventObj } = require('./events')
const { getConfig } = require('./encryptedConfig')
const discordWebhook = require('./discordWebhook')
const { Network, Order, Shop } = require('../models')

const web3 = new Web3()
const Marketplace = new web3.eth.Contract(abi)
const MarketplaceABI = Marketplace._jsonInterface

/**
 * Handles processing events emitted by the marketplace contract.
 *
 * @param web3
 * @param networkId
 * @param contractVersion
 * @param data
 * @param topics
 * @param transactionHash
 * @param blockNumber
 * @returns {Promise<void>}
 */
const handleLog = async ({
  web3,
  networkId,
  contractVersion,
  data,
  topics,
  transactionHash,
  blockNumber
}) => {
  const eventAbi = MarketplaceABI.find((i) => i.signature === topics[0])
  if (!eventAbi) {
    console.log('Unknown event')
    return
  }

  // console.log('fetch existing...', transactionHash)
  // const existingTx = await Transaction.findOne({ where: { transactionHash } })
  // if (existingTx) {
  //   console.log('Already handled tx')
  //   return
  // } else {
  //   Transaction.create({
  //     networkId,
  //     transactionHash,
  //     blockNumber: web3.utils.hexToNumber(blockNumber)
  //   })
  //     .then(res => {
  //       console.log(`Created tx ${res.dataValues.id}`)
  //     })
  //     .catch(err => {
  //       console.error(err)
  //     })
  // }

  const eventObj = getEventObj({
    data,
    topics,
    transactionHash,
    blockNumber
  })

  const listingId = `${networkId}-${contractVersion}-${eventObj.listingId}`
  const offerId = `${listingId}-${eventObj.offerId}`

  // The listener calls handleLog with any event emitted by the marketplace.
  // Skip processing any event that is not dshop related.
  const shop = await Shop.findOne({ where: { listingId } })
  if (!shop) {
    console.log(
      `Event for listing Id ${listingId} is not dshop related. Skipping.`
    )
    return
  }

  // Persist the event in the database.
  const event = await upsertEvent({
    web3,
    shopId: shop.id,
    networkId,
    event: {
      data,
      topics,
      transactionHash,
      blockNumber
    }
  })

  await insertOrderFromEvent({ offerId, event, shop })
}

async function insertOrderFromEvent({ offerId, event, shop }) {
  const eventName = event.eventName

  // Skip any event that is not offer related.
  if (eventName.indexOf('Offer') < 0) {
    console.log(`Not offer related. Ignoring event ${eventName}`)
    return
  }

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
    console.log(`Updating status of DB order ${order.orderId} to ${eventName}`)
    await order.update({
      statusStr: eventName,
      updatedBlock: event.blockNumber
    })
    return
  }

  // At this point we expect the event to be an offer creation since no existing
  // order row was found in the DB.
  if (eventName !== 'OfferCreated') {
    console.log(
      `Error: got event ${eventName} offerId ${offerId} but no order found in the DB.`
    )
    return
  }

  console.log(`${eventName} - ${event.offerId} by ${event.party}`)
  console.log(`IPFS Hash: ${event.ipfsHash}`)

  const network = await Network.findOne({ where: { active: true } })
  const networkConfig = getConfig(network.config)

  try {
    // Load the shop configuration to read things like PGP key and IPFS gateway to use.
    const shopConfig = getConfig(shop.config)
    const { dataUrl, pgpPrivateKey, pgpPrivateKeyPass } = shopConfig
    const ipfsGateway = await getIPFSGateway(dataUrl, event.networkId)
    console.log('IPFS Gateway', ipfsGateway)

    // Load the offer data. The main thing we are looking for is the IPFS hash
    // of the encrypted data.
    const offerData = await getText(ipfsGateway, event.ipfsHash, 10000)
    const offer = JSON.parse(offerData)
    console.log('Offer:', offer)

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
    const data = JSON.parse(plaintext.data)
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
      orderObj.referrer = data.referrer
      orderObj.commissionPending = Math.floor(data.subTotal / 200)
    }
    order = await Order.create(orderObj)
    console.log(`Saved order ${order.orderId} to DB.`)

    // Handle sending notifications via email and discord.
    console.log('sendMail', data)
    sendMail(shop.id, data)
    discordWebhook({
      url: networkConfig.discordWebhook,
      orderId: offerId,
      shopName: shop.name,
      total: `$${(data.total / 100).toFixed(2)}`,
      items: data.items.map((i) => i.title).filter((t) => t)
    })
  } catch (e) {
    console.error(e)
    const fields = {
      statusStr: 'error',
      data: { error: e.message }
    }
    if (order) {
      await order.update(fields)
    } else {
      await Order.create({
        networkId: event.networkId,
        shopId: shop.id,
        orderId: offerId,
        ...fields
      })
    }
  }
}

module.exports = {
  handleLog,
  insertOrderFromEvent
}
