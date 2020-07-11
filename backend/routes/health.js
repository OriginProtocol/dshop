const { Network } = require('../models')
const { makeOfferQueue } = require('../queues/queues')
const { getLogger } = require('../utils/logger')

const log = getLogger('routes.health')

module.exports = function (app) {
  // This endpoint will tell the health checks that this backend has started
  app.get('/health/started', async (req, res) => {
    res.json({ success: true })
  })

  // This will do some basic connection health checks to determine the health
  // of the backend.
  app.get('/health/status', async (req, res) => {
    try {
      // Quick DB check. There should be at least one default network and this
      // should throw if the connection is bad.
      const netCount = await Network.count()

      // Quick redis check. this should throw a MaxRetriesPerRequestError if the
      // connection is bad.  Return values for the fallbackQueue are mocked
      const jobCounts = await makeOfferQueue.getJobCounts()

      const isHealthy = !!netCount && !!jobCounts

      res
        .status(isHealthy ? 200 : 500)
        .json({ success: true, health: isHealthy })
    } catch (err) {
      log.error('Error when checking health of backend: ', err)
      // Do not return a 200 on a bad health check
      res.status(500).json({ success: true, health: false })
    }
  })
}
