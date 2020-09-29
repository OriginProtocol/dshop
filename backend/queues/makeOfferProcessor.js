const ethers = require('ethers')
const get = require('lodash/get')
const {
  marketplaceAbi,
  marketplaceTxGasLimit
} = require('@origin/utils/marketplace')

const { Network, Shop, Transaction } = require('../models')
const queues = require('./queues')
const { ListingID, OfferID } = require('../utils/id')
const {
  post,
  getBytes32FromIpfsHash,
  getIpfsHashFromBytes32
} = require('../utils/_ipfs')
const encConf = require('../utils/encryptedConfig')
const { getLogger } = require('../utils/logger')
const { IS_TEST, IS_DEV } = require('../utils/const')
const { Sentry } = require('../sentry')
const { TransactionTypes, TransactionStatuses } = require('../enums')
const { processNewOrder } = require('../logic/order')

const log = getLogger('offerProcessor')
const BN = ethers.BigNumber // Ethers' BigNumber implementation.

const ZeroAddress = '0x0000000000000000000000000000000000000000'

// Wait for 2 blocks confirmation before considering a tx mined.
const NUM_BLOCKS_CONFIRMATION = IS_TEST || IS_DEV ? 0 : 2

// Gas premium.
// We use 1% extra gas to be ahead of other transactions submitted to the network using default gas prices.
// Since ethers BigNumber does not support float, we define a multiplier and a divider.
const gasPriceMultiplier = BN.from(101)
const gasPriceDivider = BN.from(100)

/**
 * Function to start the queue processing.
 */
function attachToQueue() {
  const queue = queues['makeOfferQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

function queueLog(job, progress, str) {
  job.log(str)
  job.progress(progress)
}

/**
 * Records an offer on the blockchain by sending a transaction to the marketplace contract.
 * Does not record the order in the database: once the transaction is mined, the listener
 * will receive an 'OfferCreated' event and create the order in the database.
 *
 * @param {object} job
 * @param {string} fqJobId: fully qualified job id.
 * @param {models.Network} network
 * @param {object} networkConfig
 * @param {models.Shop} shop
 * @param {object} shopConfig
 * @param {ListingID} lid
 * @param {object} offer: JSON of the unencrypted offer data.
 * @param {string} offerIpfsHash: IPFS hash of the unencrypted offer data.
 * @param {string} paymentCode
 * @returns {Promise<ethers.TransactionReceipt>}
 * @private
 */
async function _makeOnchainOffer({
  job,
  fqJobId,
  network,
  networkConfig,
  shop,
  shopConfig,
  lid,
  offer,
  offerIpfsHash,
  paymentCode
}) {
  const shopId = shop.id

  // Use the Shop PK if there is one, otherwise fall back to Network PK.
  if (!shopConfig.web3Pk) {
    if (!networkConfig.web3Pk) {
      throw new Error(`PK missing in both shop ${shopId} and network configs`)
    }
    log.info(`No PK configured for shop ${shopId}. Falling back to network PK`)
  }
  const pk = shopConfig.web3Pk || networkConfig.web3Pk
  const provider = new ethers.providers.JsonRpcProvider(network.provider)
  const wallet = new ethers.Wallet(pk, provider)
  const walletAddress = wallet.address
  const marketplace = new ethers.Contract(
    network.marketplaceContract,
    marketplaceAbi,
    wallet
  )
  queueLog(job, 22, `Using walletAddress ${walletAddress}`)

  let tx, transaction

  // In order to avoid re-using the same nonce, we want to prevent more than 1 transaction
  // being sent by a given wallet at a time.
  // Check if there is any existing pending transaction for the same wallet address.
  // Different scenarios could cause that:
  //  - Since multiple processors run concurrently, another job for the same wallet
  //    could be getting processed.
  //  - The processing a job could get interrupted while waiting for the tx to get mined.
  //    For example due to a server maintenance or a crash.
  // TODO: Figure out a way to avoid any possible race condition.
  //       With Postgres, we could hold a lock on a DB row associated with the wallet address
  //       while doing the pending transaction check and sending the tx.
  //       With SqlLite holding a lock is not an option so we'll have to find an alternative.
  transaction = await Transaction.findOne({
    where: {
      networkId: network.networkId,
      fromAddress: walletAddress,
      status: TransactionStatuses.Pending
    }
  })
  if (transaction) {
    log.info(
      `Found pending transaction ${transaction.id} job ${transaction.jobId} hash ${transaction.hash} for wallet ${walletAddress}`
    )

    // If it is not the transaction from our job. Do not try to recover it.
    // Let it get recovered by the job that created it when it gets retried.
    // Fail our job for now, it will get retried.
    if (transaction.jobId !== fqJobId) {
      throw new Error(
        `Pending transaction is not from job ${fqJobId} but ${transaction.jobId}. Bailing.`
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
    queueLog(job, 25, 'Sending to marketplace')
    tx = await _createOffer(
      provider,
      marketplace,
      wallet,
      lid,
      offer,
      offerIpfsHash
    )
    log.info('Transaction sent:', tx)

    // Record the transaction in the DB.
    transaction = await Transaction.create({
      shopId,
      networkId: network.networkId,
      fromAddress: walletAddress,
      toAddress: network.marketplaceContract,
      type: TransactionTypes.OfferCreated,
      status: TransactionStatuses.Pending,
      hash: tx.hash,
      listingId: lid.toString(),
      ipfsHash: offerIpfsHash,
      jobId: fqJobId,
      customId: paymentCode // Allows to join the transactions and external_payments table.
    })
  }

  // Wait for the tx to get mined.
  // Note: this is blocking with no timeout. Depending on the network conditions,
  // it could take a long time for a tx to get mined. This will become a bottleneck
  // in the future when the transaction volume scales up. A potential solution
  // will be to run the confirmation logic as a separate queue with multiple workers.
  queueLog(job, 50, `Waiting for tx ${tx.hash} to get confirmed`)
  log.info('Waiting for offer tx confirmation...')
  const confirmation = await _waitForMakeOfferTxConfirmation(marketplace, tx)
  const { receipt, offerId } = confirmation
  log.debug('offer tx confirmed')

  // Update the transaction in the DB.
  // Note: Failed transactions (e.g. caused by an EVM revert) are not retried since
  // it's unlikely they would succeed given the arguments of the transaction would not change
  // as part of the retry. Those failures will need to get manually retried by the operator.
  const oid = new OfferID(lid.listingId, offerId, network.networkId)
  await transaction.update({
    status: receipt.status
      ? TransactionStatuses.Confirmed
      : TransactionStatuses.Failed,
    blockNumber: receipt.blockNumber,
    offerId: oid.toString() // Store the fully qualified offerId.
  })

  return confirmation
}

/**
 * Creates an offer in the database. Does not write to the blockchain.
 *
 * @param {object} job
 * @param {string} fqJobId: fully qualified job id.
 * @param {models.Network} network
 * @param {object} networkConfig
 * @param {models.Shop} shop
 * @param {object} shopConfig
 * @param {ListingID} lid
 * @param {object} offer: JSON of the unencrypted offer data.
 * @param {string} offerIpfsHash: IPFS hash of the unencrypted offer data.
 * @param {string} paymentCode
 * @param {enums.OrderPaymentTypes} paymentType
 * @param {enums.OrderPaymentStatuses} paymentStatus override payment status
 * @returns {Promise<models.Order>}
 * @private
 */
async function _makeOffchainOffer({
  job,
  fqJobId,
  network,
  networkConfig,
  shop,
  shopConfig,
  lid,
  offer,
  offerIpfsHash,
  paymentCode,
  paymentType,
  paymentStatus
}) {
  queueLog(job, 30, `Creating order`)
  log.info(
    `Creating off-chain offer jobId: ${fqJobId} listingId: ${lid.toString()} paymentCode: ${paymentCode}`
  )

  const order = await processNewOrder({
    network,
    networkConfig,
    shop,
    shopConfig,
    offer,
    offerIpfsHash,
    paymentType,
    paymentStatus,
    offerId: null, // on-chain offers do not have a blockchain offer Id.
    event: null, // on-chain offers do not have a blockchain event.
    skipEmail: false,
    skipDiscord: false
  })
  return order
}

/**
 * Records an offer in the system. Depending on the shop's configuration, the offer is either
 * recorded on the blockchain (aka "on-chain") or only in the database (aka "off-chain").
 *
 * Note: several processors may get started, resulting in
 * multiple jobs getting processed concurrently.
 *
 * @param {Object} job: Bull job object.
 * job.data has the following fields:
 *   {string} shopId: Unique DB id for the shop.
 *   {string} paymentCode: Unique payment code.
 *   {string} encryptedDataIpfsHash: IPFS hash of the PGP encrypted offer data.
 *   {enums.OrderPaymentTypes} paymentType: Payment type of order
 *   {enums.OrderPaymentStatuses} paymentStatus: To override paymentStatus of the order
 * @returns {Promise<models.Order || {receipt: ethers.TransactionReceipt, listingId: number, offerId: number, ipfsHash: string }>}
 * @throws
 */
async function processor(job) {
  const fqJobId = `${get(job, 'queue.name', '')}-${job.id}` // Prefix with queue name since job ids are not unique across queues.
  const {
    shopId,
    paymentCode,
    encryptedDataIpfsHash,
    paymentType,
    paymentStatus
  } = job.data
  log.info(`Creating offer for shop ${shopId}`)
  let result

  try {
    const shop = await Shop.findOne({ where: { id: shopId } })
    if (!shop) {
      throw new Error(`Failed loading shop with id ${shopId}`)
    }

    queueLog(job, 5, 'Load encrypted shop config')
    const network = await _getNetwork(shop.networkId)
    const networkConfig = encConf.getConfig(network.config)
    const shopConfig = encConf.getConfig(shop.config)

    queueLog(job, 10, 'Creating offer')
    log.debug('Creating offer on IPFS')
    const lid = ListingID.fromFQLID(shop.listingId)
    const offer = _createOfferJson(lid, encryptedDataIpfsHash, paymentCode)
    const offerIpfsHash = await _postOfferIPFS(network, offer)
    log.debug(`Created offer on IPFS with hash ${offerIpfsHash}`)

    queueLog(job, 20, 'Submitting Offer')

    // Create the offer in the system either on or off chain, depending on the configuration.
    const data = {
      job,
      fqJobId,
      network,
      networkConfig,
      shop,
      shopConfig,
      lid,
      offer,
      offerIpfsHash,
      paymentCode,
      paymentType,
      paymentStatus
    }
    if (network.useMarketplace) {
      result = await _makeOnchainOffer(data)
    } else {
      result = await _makeOffchainOffer(data)
    }

    queueLog(job, 100, 'Finished')
  } catch (e) {
    // Log the exception and rethrow so that the job gets retried.
    Sentry.captureException(e)
    log.error(`Offer creation for shop ${shopId} failed:`, e)
    throw e
  }

  return result
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
 * @param {string} encryptedData: IPFS hash of the encrypted offer data
 * @param {string} paymentCode: Unique payment code.
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
  log.debug(`Posting offer on IPFS using gateway ${network.ipfsApi}`)
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
  const gasLimit = BN.from(marketplaceTxGasLimit) // Amount of gas needed to make an offer.
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
