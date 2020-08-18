const randomstring = require('randomstring')

const { authShop } = require('./_auth')
const { Network, PaymentSession, Transaction } = require('../models')
const { txQueue } = require('../queues/queues')
const { getShopOfferData } = require('../utils/offer')

const { getLogger } = require('../utils/logger')
const { TransactionTypes, TransactionStatuses } = require('../enums')

const log = getLogger('routes.crypto')

// How long before a payment session is considered expired.
const PAYMENT_SESSION_TIMEOUT = 10 * 60 * 1000 // 10 min

// Endpoints for handling direct crypto payments that do not go thru the
// marketplace contract.
// The flow is as follow:
//   1. FE calls /crypto/payment-code to get a paymentCode
//   2. FE sends the blockchain tx to the network and gets a tx hash back
//   3. FE calls /crypto/payment with the tx hash and the paymentCode
//   4. BE waits for the tx to get mined
//   5. BE processes the order

module.exports = function (router) {
  /**
   * Endpoint to request a payment code to the back-end.
   *
   * The body of the request is expected to include:
   *   {string} fromAddress: Address sending the transaction.
   *   {string} toAddress: Address receiving the transaction.
   *   {string} amount: transaction amount
   *   {string} currency: transaction currency (ex: ETH, OGN, etc...).
   */
  router.get('/crypto/payment-code', authShop, async (req, res) => {
    const shop = req.shop
    const { fromAddress, toAddress, amount, currency } = req.body
    if (!fromAddress) {
      return res.json({ success: false, message: 'No fromAddress specified' })
    }
    if (!toAddress) {
      return res.json({ success: false, message: 'No toAddress specified' })
    }
    if (!amount) {
      return res.json({ success: false, message: 'No amount specified' })
    }
    if (!currency) {
      return res.json({ success: false, message: 'No currency specified' })
    }

    // Record the payment session in the DB.
    const session = await PaymentSession.create({
      shopId: shop.id,
      fromAddress,
      toAddress,
      amount,
      currency,
      code: randomstring.generate()
    })

    // Return the paymentCode to the caller.
    return res.json({ success: true, paymentCode: session.code })
  })

  /**
   * Endpoint for the front-end to notify the back-end that a crypto payment was made.
   * The back-end waits until the payment is confirmed on the blockchain and then
   * processes the order.
   *
   * The request should include an Authorization token for the shop where the purchase was made.
   * The body of the request is expected to include:
   *   {string} txHash: hash of the tx to watch.
   *   {string} fromAddress: Address sending the transaction.
   *   {string} toAddress: Address receiving the transaction.
   *   {string} ipfsHash: IPFS hash of the offer data. Note: the data should include a one-time
   *                      payment code obtained by calling the /crypto/payment-token endpoint.
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

    // Load the offer data from IPFS and look for the paymentCode.
    const { offer, data } = await getShopOfferData(shop, ipfsHash)
    const paymentCode = offer.paymentCode
    if (!paymentCode) {
      return res.json({
        success: false,
        message: 'Offer IPFS data does not include a paymentCode'
      })
    }

    // Check the validity of the payment session.
    const paymentSession = await PaymentSession.findOne({
      where: { paymentCode }
    })
    if (!paymentSession) {
      return res.json({ success: false, message: 'Invalid paymentCode' })
    }
    if (
      paymentSession.shopId !== shop.id ||
      paymentSession.toAddress !== toAddress ||
      paymentSession.fromAddress !== fromAddress ||
      paymentSession.amount !== data.total || // TODO(franck): check this field's naming in the data
      paymentSession.currency !== data.currency
    ) {
      return res.json({ success: false, message: 'Invalid paymentCode' })
    }
    const sessionExpire = Date.now() - PAYMENT_SESSION_TIMEOUT
    if (paymentSession.createdAt < sessionExpire) {
      return res.json({ success: false, message: 'Payment session expired' })
    }

    // Insert a new row in Transaction table for tracking purposes.
    await Transaction.create({
      shopId: shop.id,
      networkId: network.networkId,
      fromAddress,
      toAddress,
      type: TransactionTypes.Payment,
      status: TransactionStatuses.Pending,
      hash: txHash,
      listingId: shop.listingId,
      customId: paymentCode // Record the paymentCode in the custom_id field.
    })

    // Enqueue a job to wait for the tx to get mined on the blockchain.
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
