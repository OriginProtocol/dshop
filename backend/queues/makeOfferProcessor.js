const ethers = require('ethers')

const { marketplaceAbi } = require('@origin/utils/marketplace')

const queues = require('./queues')
const { ListingID, OfferID } = require('../utils/id')
const { Network, Shop, Transaction } = require('../models')
const {
  post,
  getBytes32FromIpfsHash,
  getIpfsHashFromBytes32
} = require('../utils/_ipfs')
const encConf = require('../utils/encryptedConfig')
const { Sentry } = require('../sentry')
const { getLogger } = require('../utils/logger')
const { TransactionTypes, TransactionStatuses } = require('../enums')

const log = getLogger('offerProcessor')
const BN = ethers.BigNumber // Ethers' BigNumber implementation.

const ZeroAddress = '0x0000000000000000000000000000000000000000'

// Wait for 2 blocks confirmation before considering a tx mined.
const NUM_BLOCKS_CONFIRMATION = 2

// Gas premium.
// We use 1% extra gas to be ahead of other transactions submitted to the network using default gas prices.
// Since ethers BigNumber does not support float, we define a multiplier and a divider.
const gasPriceMultiplier = BN.from(101)
const gasPriceDivider = BN.from(100)

function attachToQueue() {
  const queue = queues['makeOfferQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

/**
 * Records a credit card purchase on the blockchain by making
 * an offer on the marketplace contract.
 *
 * @param {Object} job: Bull job object.
 * job.data is expected to have the following fields:
 *   {string} shopID
 *   {string} amount: Credit card payment amount, in cents.
 *   {string} encryptedData: IPFS hash of the PGP encrypted offer data.
 *   {string} paymentCode: unique payment code passed by the credit card processor.
 * @returns {Promise<{receipt: ethers.TransactionReceipt, listingId: number, offerId: number, ipfsHash: string }>}
 * @throws
 */
async function processor(job) {
  const queueLog = (progress, str) => {
    job.log(str)
    job.progress(progress)
  }

  const { shopId, encryptedData, paymentCode } = job.data
  log.info(`Creating offer for shop ${shopId}`)
  let confirmation

  try {
    const shop = await Shop.findOne({ where: { id: shopId } })
    if (!shop) {
      throw new Error(`Failed loading shop with id ${shopId}`)
    }

    queueLog(5, 'Load encrypted shop config')
    const network = await _getNetwork(shop.networkId)
    const networkConfig = encConf.getConfig(network.config)
    const shopConfig = encConf.getConfig(shop.config)

    queueLog(10, 'Creating offer')
    const lid = ListingID.fromFQLID(shop.listingId)
    const offer = _createOfferJson(lid, encryptedData, paymentCode)
    const ipfsHash = await _postOfferIPFS(network, offer)

    queueLog(20, 'Submitting Offer')

    // Use the Shop PK if there is one, otherwise fall back to Network PK.
    if (!shopConfig.web3Pk) {
      if (!networkConfig.web3Pk) {
        throw new Error(`PK missing in both shop ${shopId} and network configs`)
      }
      log.info(
        `No PK configured for shop ${shopId}. Falling back to network PK`
      )
    }
    const pk = shopConfig.web3Pk || networkConfig.web3Pk
    const provider = new ethers.providers.JsonRpcProvider(network.provider)
    const wallet = new ethers.Wallet(pk, provider)
    const walletAddress = wallet.address
    const marketplace = new ethers.Contract(
      network.marketplaceContract,
      marketplaceAbi,
      provider
    )
    queueLog(22, `Using walletAddress ${walletAddress}`)

    let tx, transaction

    // Check if there is a pending transaction for the wallet.
    // It's possible the processing got interrupted while waiting for the tx to get mined.
    // For example due to a server maintenance or a crash.
    transaction = await Transaction.findOne({
      where: {
        networkId: network.networkId,
        wallet: walletAddress,
        status: TransactionStatuses.Pending
      }
    })
    if (transaction) {
      log.info(
        `Found pending transaction ${transaction.id} job ${job.jobId} hash ${transaction.hash} for wallet ${walletAddress}`
      )

      // If it is not the transaction from our job. Do not try to recover it.
      // Let it get recovered by the job that created it.
      // Fail our job for now, it will get retried.
      if (transaction.jobId === job.jobId) {
        throw new Error(
          `Pending transaction does not belongs to job ${job.jobId}. Bailing.`
        )
      }

      // Try to recover by loading the tx from its hash.
      tx = await provider.getTransaction(transaction.hash)
      if (!tx) {
        // The transaction was not mined and is not in the transaction pool.
        // Something went really wrong...
        throw new Error(
          `Transaction ${transaction.id} with hash ${transaction.hash} not found`
        )
      }
      log.info('Recovered tx', tx)
    } else {
      // Send a blockchain transaction to make an offer on the marketplace contract.
      queueLog(25, 'Sending to marketplace')
      tx = await _createOffer(
        provider,
        marketplace,
        wallet,
        lid,
        offer,
        ipfsHash
      )
      log.info('Transaction sent:', tx)

      // Record the transaction in the DB.
      transaction = await Transaction.create({
        shopId,
        networkId: network.networkId,
        wallet: walletAddress,
        type: TransactionTypes.OfferCreated,
        status: TransactionStatuses.Pending,
        hash: tx.hash,
        listingId: lid.toString(),
        ipfsHash,
        jobId: job.jobId
      })
    }

    // Wait for the tx to get mined.
    // Note: this is blocking with no timeout. Depending on the network conditions,
    // it could take a long time for a tx to get mined. This will become a bottleneck
    // in the future when the transaction volume scales up. A potential solution
    // will be to run the confirmation logic as a separate queue with multiple workers.
    queueLog(50, `Waiting for tx ${tx.hash} to get confirmed`)
    log.info('Waiting for tx confirmation...')
    confirmation = await _waitForMakeOfferTxConfirmation(marketplace, tx)
    const { receipt, offerId } = confirmation

    // Update the transaction in the DB.
    const oid = new OfferID(lid.listingId, offerId)
    await transaction.update({
      status: TransactionStatuses.Confirmed,
      blockNumber: receipt.blockNumber,
      offerId: oid.toString() // Store the fully qualified offerId.
    })

    queueLog(100, 'Finished')
  } catch (e) {
    // Log the exception and rethrow so that the job gets retried.
    Sentry.captureException(e)
    log.error(`Offer creation for shop ${shopId} failed:`, e)
    throw e
  }

  return confirmation
}

/**
 * Utility method. Loads a network DB object based on its id
 * @param {number} networkId
 * @returns {Promise<{models.Network}>}
 * @private
 */
async function _getNetwork(networkId) {
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

/**
 * Utility method. Creates a JSON object for an offer.
 *
 * @param {ListingID} lid
 * @param {string} encryptedData
 * @param paymentCode
 * @returns {{finalizes: number, paymentCode: *, totalPrice: {amount: number, currency: string}, schemaId: string, encryptedData: *, listingType: string, commission: {amount: string, currency: string}, listingId: *, unitsPurchased: number}}
 * @private
 */
function _createOfferJson(lid, encryptedData, paymentCode) {
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

/**
 * Utility method. Uploads an offer data to IPFS and gets the hash back.
 *
 * @param {models.Network} network
 * @param {Object} offer
 * @returns {Promise<string>} IPFS hash
 * @private
 */
async function _postOfferIPFS(network, offer) {
  try {
    return await post(network.ipfsApi, offer, true)
  } catch (err) {
    err.message = `Error adding offer on listing ${offer.listingId} to ${network.ipfsApi}! ${err.message}`
    throw err
  }
}

/**
 * Sends an offer transaction to the blockchain.
 *
 * @param {ethers.Provider} provider
 * @param {ethers.Contract} marketplace
 * @param {ethers.Wallet} wallet
 * @param {ListingID} lid
 * @param {Object} offer
 * @param {string} ipfsHash
 * @returns {Promise<ethers.Transaction>}
 * @private
 */
async function _createOffer(
  provider,
  marketplace,
  wallet,
  lid,
  offer,
  ipfsHash
) {
  const ethBalance = await wallet.getBalance()
  const gasPrice = await provider.getGasPrice()
  const gasLimit = new BN(350000) // Amount of gas needed to make an offer.
  const gasCost = gasPrice
    .mul(gasLimit)
    .mul(gasPriceMultiplier)
    .div(gasPriceDivider)

  log.info(`Account:           ${wallet.address}`)
  log.info(`ETH balance:       ${ethers.utils.formatEther(ethBalance)}`)
  log.info(`Gas cost estimate: ${ethers.utils.formatEther(gasCost)}`)

  if (ethBalance.lt(gasCost)) {
    throw new Error(`Insufficient ETH balance to pay for gas cost`)
  }

  const options = { gasLimit, gasPrice }
  const tx = await marketplace.makeOffer(
    lid.listingId,
    getBytes32FromIpfsHash(ipfsHash),
    offer.finalizes,
    ZeroAddress, // Affiliate
    '0', // Commission
    '0', // Value
    ZeroAddress, // Currency
    wallet.address, // Arbitrator
    options
  )
  return tx
}

/**
 * Waits for a blockchain transaction to get mined.
 * Note: no timeout is set so this is blocking.
 *
 * @param {ethers.Contract} marketplace
 * @param {ethers.Transaction} tx
 * @returns {Promise<{receipt: ethers.TransactionReceipt, listingId: number, offerId: number, ipfsHash: string }>}
 * @private
 */
async function _waitForMakeOfferTxConfirmation(marketplace, tx) {
  // Wait on the blockchain to mine the transaction.
  const receipt = await tx.wait(NUM_BLOCKS_CONFIRMATION)

  // Extracts the offer id from the logs.
  const offerLog = receipt.logs
    .map((l) => {
      try {
        return marketplace.interface.parseLog(l)
      } catch (e) {
        /* Ignore */
      }
    })
    .filter((l) => l)
    .find((e) => e.name === 'OfferCreated')

  if (!offerLog) {
    throw new Error(`No OfferCreated log found for tx ${tx.hash}`)
  }

  const listingId = offerLog.args.listingID.toNumber()
  const offerId = offerLog.args.offerID.toNumber()
  const ipfsHash = getIpfsHashFromBytes32(offerLog.args.ipfsHash)

  return { receipt, listingId, offerId, ipfsHash }
}

module.exports = { processor, attachToQueue }
