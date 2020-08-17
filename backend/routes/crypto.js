const { authShop } = require('./_auth')
const { Network, Transaction } = require('../models')
const { txQueue } = require('../queues/queues')

const { getLogger } = require('../utils/logger')
const { TransactionTypes, TransactionStatuses } = require('../enums')

const log = getLogger('routes.crypto')

module.exports = function (router) {
  /**
   * Enqueues a background job that waits for a payment transaction
   * to get mined on the blockchain, then processes the order.
   *
   */
  router.post('/crypto/payment', authShop, async (req, res) => {
    const shop = req.shop
    const { txHash, fromAddress, toAddress, ipfsHash } = req.body
    if (!txHash) {
      return res.json({ success: false, message: 'No txHash specified' })
    }
    if (!fromAddress) {
      return res.json({ success: false, message: 'No fromAddress specified' })
    }
    if (!toAddress) {
      return res.json({ success: false, message: 'No toAddress specified' })
    }
    if (!ipfsHash) {
      return res.json({ success: false, message: 'No ipfsHash specified' })
    }

    const network = await Network.findOne({
      where: { networkId: req.shop.networkId, active: true }
    })

    // Make sure this transaction is not already being processed.
    const transaction = await Transaction.findOne({
      networkId: network.id,
      hash: txHash
    })
    if (transaction) {
      // This route must have been called more than once by the UI.
      // Nothing to do since the first call enqueued the job.
      log.warning(
        `Existing transaction ${transaction.id} found for hash ${txHash}. Skipping..`
      )
      return res.json({ success: true })
    }

    // Insert a new Transaction row in the DB for tracking purposes.
    await Transaction.create({
      shopId: shop.id,
      networkId: network.networkId,
      fromAddress,
      toAddress,
      type: TransactionTypes.Payment,
      status: TransactionStatuses.Pending,
      hash: txHash,
      listingId: shop.listingId
    })

    // Enqueue a job to wait for the tx to get mined.
    const job = await txQueue.add({
      shopId: shop.id,
      fromAddress,
      toAddress,
      txHash,
      ipfsHash
    })
    log.info(
      `Shop ${shop.id} - Enqueued job ${job.id} for tracking tx with hash ${txHash}`
    )

    return res.json({ success: true })
  })
}
