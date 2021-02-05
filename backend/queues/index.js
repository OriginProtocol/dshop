const discordWebhook = require('../utils/discordWebhook')
const queues = require('./queues')
const get = require('lodash/get')

// List of queues and shops for which we don't post failures in discord for.
const discordBlacklistQueues = ['autossl']
const discordBlacklistShopIds = [1] // Gitcoin (shopId=1) is deleted.

/**
 * Attaches all backend queue processing functions to their respective queues.
 */
function runProcessors() {
  require('./makeOfferProcessor').attachToQueue()
  require('./printfulSyncProcessor').attachToQueue()
  require('./eventsProcessor').attachToQueue()
  require('./autosslProcessor').attachToQueue()
  require('./etlProcessor').attachToQueue()
  require('./txProcessor').attachToQueue()
  require('./deploymentProcessor').attachToQueue()
  require('./dnsStatusProcessor').attachToQueue()

  const failureCallback = (job, error) => {
    const queueName = job.queue.name
    const shopId = get(job, 'data.shopId', -1)
    if (
      discordBlacklistQueues.includes(queueName) ||
      discordBlacklistShopIds.includes(Number(shopId))
    ) {
      return
    }

    discordWebhook.postQueueError({
      queueName,
      errorMessage: error.message,
      jobId: job.id,
      shopId: get(job, 'data.shopId', ''),
      attempts: job.attemptsMade,
      stackTrace: error.stack
    })
  }

  for (const queueName in queues) {
    queues[queueName].on('failed', failureCallback)
  }
}

module.exports = {
  queues,
  runProcessors
}
