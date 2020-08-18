const { makeOfferQueue } = require('../queues/queues')

/**
 * req.shop
 * req.amount amount in cents
 * req.body.data encrypted IPFS data hash
 */
async function makeOffer(req, res) {
  const shop = req.shop
  const amount = req.amount
  const encryptedDataIpfsHash = req.body.data
  const paymentCode = req.paymentCode

  await makeOfferQueue.add(
    {
      shopId: shop.id,
      amount,
      encryptedDataIpfsHash,
      paymentCode
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

  res.sendStatus(200)
}

module.exports = makeOffer
