const queues = require('./queues')

const Web3 = require('web3')

const { ListingID } = require('../utils/id')
const { Shop, Network } = require('../models')
const { post, getBytes32FromIpfsHash } = require('../utils/_ipfs')
const encConf = require('../utils/encryptedConfig')
const abi = require('../utils/_abi')
const { Sentry } = require('../sentry')
const { getLogger } = require('../utils/logger')

const log = getLogger('offerProcessor')

const ZeroAddress = '0x0000000000000000000000000000000000000000'

function attachToQueue() {
  const queue = queues['makeOfferQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

/**
 * Processes a credit card transaction and submit it to the blockchain.
 *
 * job.data should have {shopId, amount, encryptedData}
 * @param {*} job
 */
async function processor(job) {
  const queueLog = (progress, str) => {
    job.log(str)
    job.progress(progress)
  }

  const { shopId, encryptedData, paymentCode } = job.data
  log.info(`Creating offer for shop ${shopId}`)

  try {
    const shop = await getShop(shopId)
    queueLog(5, 'Load encrypted shop config')
    const network = await getNetwork(shop.networkId)
    const networkConfig = encConf.getConfig(network.config)
    const shopConfig = encConf.getConfig(shop.config)

    queueLog(10, 'Creating offer')
    const lid = ListingID.fromFQLID(shop.listingId)
    const offer = createOfferJson(lid, encryptedData, paymentCode)
    const ires = await postOfferIPFS(network, offer)

    queueLog(20, 'Submitting Offer')
    const web3 = new Web3(network.provider)

    // Use the Shop PK if there is one, otherwise fall back to Network PK.
    if (!shopConfig.web3Pk) {
      if (!networkConfig.web3Pk) {
        throw new Error('PK missing in both shop and network configs')
      }
      log.info(
        `No PK configured for shop ${shopId}. Falling back to network PK`
      )
    }
    const backendPk = shopConfig.web3Pk || networkConfig.web3Pk
    const account = web3.eth.accounts.wallet.add(backendPk)
    const walletAddress = account.address
    queueLog(22, `Using walletAddress ${walletAddress}`)
    queueLog(25, 'Sending to marketplace')
    const tx = await offerToMarketplace(
      web3,
      lid,
      network,
      walletAddress,
      offer,
      ires
    )
    queueLog(50, JSON.stringify(tx))

    // TODO: Code to prevent duplicate txs
    // TODO Record tx and wait for TX to go through the blockchain

    queueLog(100, 'Finished')
  } catch (e) {
    // Log the exception and rethrow so that the job gets retried.
    Sentry.captureException(e)
    log.error(`Offer creation for shop ${shopId} failed:`, e)
    throw e
  }
}

async function getShop(id) {
  try {
    return await Shop.findOne({ where: { id } })
  } catch (err) {
    err.message = `Could not load shop from ID '${id}'. ${err.message}`
    throw err
  }
}

async function getNetwork(networkId) {
  const network = await Network.findOne({
    where: { networkId: networkId, active: true }
  })
  if (!network) {
    throw new Error(`Could not find network ${networkId}`)
  }
  if (!network.marketplaceContract) {
    throw new Error(
      'Missing marketplaceContract address for network. Unable to send transaction.'
    )
  }
  return network
}

function createOfferJson(lid, encryptedData, paymentCode) {
  return {
    schemaId: 'https://schema.originprotocol.com/offer_2.0.0.json',
    listingId: lid.toString(),
    listingType: 'unit',
    unitsPurchased: 1,
    totalPrice: {
      amount: 0,
      currency: 'encrypted'
    },
    commission: { currency: 'OGN', amount: '0' },
    finalizes: 60 * 60 * 24 * 14, // 2 weeks after offer accepted
    encryptedData: encryptedData,
    paymentCode: paymentCode
  }
}

async function postOfferIPFS(network, offer) {
  try {
    return await post(network.ipfsApi, offer, true)
  } catch (err) {
    err.message = `Error adding offer on listing ${offer.listingId} to ${network.ipfsApi}! ${err.message}`
    throw err
  }
}

async function offerToMarketplace(
  web3,
  lid,
  network,
  walletAddress,
  offer,
  ires
) {
  const Marketplace = new web3.eth.Contract(abi, network.marketplaceContract)
  const offerTx = Marketplace.methods.makeOffer(
    lid.listingId,
    getBytes32FromIpfsHash(ires),
    offer.finalizes,
    ZeroAddress, // Affiliate
    '0',
    '0',
    ZeroAddress,
    walletAddress // Arbitrator
  )
  const tx = await offerTx.send({ from: walletAddress, gas: 350000 })
  return tx
}

module.exports = { processor, attachToQueue }
