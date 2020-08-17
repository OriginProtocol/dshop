const ethers = require('ethers')
const { Network, Shop, Transaction } = require('../models')
const queues = require('./queues')
const { getLogger } = require('../utils/logger')
const { IS_TEST } = require('../utils/const')
const { TransactionStatuses } = require('../enums')

const log = getLogger('listingCreatedProcessor')

// Wait for 2 blocks confirmation before considering a tx mined.
const NUM_BLOCKS_CONFIRMATION = IS_TEST ? 0 : 2

/**
 * Function to start the queue processing.
 */
function attachToQueue() {
  const queue = queues['txQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

/**
 * Waits for a blockchain transaction to get confirmed,
 * then enqueues a job to make an offer.
 *
 * @param {Object} job: Bull job object.
 * job.data is expected to have the following fields:
 *   {number} shopId: Id of the shop.
 *   {string} txHash: hash of the tx to watch.
 *   {string} fromAddress: Address sending the transaction.
 *   {string} toAddress: Address receiving the transaction.
 *   {string} ipfsHash: IPFS hash of the data.
 * @returns {Promise<TransactionReceipt>}
 * @throws
 */
async function processor(job) {
  const queueLog = (progress, str) => {
    job.log(str)
    job.progress(progress)
  }
  const jobId = `${job.queue.name}-${job.id}` // Prefix with queue name since job ids are not unique across queues.

  const { shopId, txHash, fromAddress, ipfsHash } = job.data
  log.info(`txProcessor for job with data: ${job.data}`)

  // TODO: check the validity of the IPFS data?

  // Load the associated shop.
  const shop = await Shop.findOne({ where: { id: shopId } })
  if (!shop) {
    throw new Error(`Failed loading shop with id ${shopId}`)
  }

  // Load the active network and create an associated ether.js provider.
  const network = await Network.findOne({
    where: { networkId: shop.networkId, active: true }
  })
  if (!network) {
    throw new Error(`Failed loading active network with id ${shop.networkId}`)
  }
  const provider = new ethers.providers.JsonRpcProvider(network.provider)

  // Load the transaction from the DB.
  const transaction = await Transaction.findOne({
    networkId: network.id,
    shopId,
    hash: txHash
  })
  if (!transaction) {
    throw new Error(
      `No transaction found in the DB with hash ${txHash} for shop ${shopId} and wallet ${fromAddress}`
    )
  }

  // Load the tx from the blockchain based on its hash.
  queueLog(25, 'Loading tx from the blockchain')
  const tx = await provider.getTransaction(txHash)
  if (!tx) {
    throw new Error(`Transaction with hash ${txHash} not found`)
  }
  log.info(`Loaded tx with hash ${txHash} from the network`)

  // TODO: check to and from address.

  // Wait for the tx to get mined.
  queueLog(50, `Waiting for tx ${txHash} to get confirmed`)
  log.info('Waiting for tx ${txHash} confirmation...')
  const receipt = await tx.wait(NUM_BLOCKS_CONFIRMATION)
  if (receipt.status) {
    // Payment was successful.
    // Enqueue a job to record an offer on the marketplace contract.
    const makeOfferQueue = queues['makeOffer']
    const jobData = { shopId, ipfsHash }
    const jobOpts = {
      // Up to 6 attempts with exponential backoff with a 60sec initial delay.
      attempts: 6,
      backoff: {
        type: 'exponential',
        delay: 60000
      }
    }
    await makeOfferQueue.add(jobData, jobOpts)

    // Update the transaction in the DB.
    await transaction.update({
      status: TransactionStatuses.Confirmed,
      blockNumber: receipt.blockNumber,
      jobId
    })
  } else {
    log.info(
      `Shop ${shopId}: tx with hash ${txHash} was reverted. Skipping offer creation.`
    )
    await transaction.update({
      status: TransactionStatuses.Failed,
      blockNumber: receipt.blockNumber,
      jobId
    })
  }

  queueLog(100, 'Finished')
  return receipt
}

module.exports = { processor, attachToQueue }
