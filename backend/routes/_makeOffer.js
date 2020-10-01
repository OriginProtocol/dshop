const { makeOfferQueue } = require('../queues/queues')

/**
 * req.shop
 * req.amount amount in cents
 * req.body.data encrypted IPFS data hash
 */
async function makeOffer(req, res) {
  const encryptedDataIpfsHash = req.body.data
  const { shop, amount, paymentCode, paymentType, paymentStatus } = req

  await makeOfferQueue.add(
    {
      shopId: shop.id,
      amount,
      encryptedDataIpfsHash,
      paymentCode,
      paymentType,
      paymentStatus
    },
    {
      // Up to 6 attempts with exponential backoff with a 60sec initial delay.
      attempts: 6,
      backoff: {
        type: 'exponential',
        delay: 60000
      }
    }
  )

  res.json({ success: true })
}

module.exports = makeOffer
