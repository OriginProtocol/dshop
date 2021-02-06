const { Sentry } = require('../sentry')
const discordWebhook = require('../utils/discordWebhook')
const queues = require('./queues')
const get = require('lodash/get')

// Queues for which we log errors in Sentry.
const sentryWhitelistedQueues = ['events', 'makeOffer', 'printfulSync', 'tx']

// Queues and shops for which we don't post failures in discord.
const discordBlacklistedQueues = ['autossl']
const discordBlacklistedShopIds = [1] // Gitcoin (shopId=1) is deleted.

/**
 * Queue failure callback function.
 */
function failureCallback(job, error) {
  const queueName = job.queue.name
  const shopId = get(job, 'data.shopId', -1)

  if (sentryWhitelistedQueues.includes(queueName)) {
    Sentry.captureException(error)
  }

  if (
    discordBlacklistedQueues.includes(queueName) ||
    discordBlacklistedShopIds.includes(Number(shopId))
  ) {
    discordWebhook.postQueueError({
      queueName,
      errorMessage: error.message,
      jobId: job.id,
      shopId,
      attempts: job.attemptsMade,
      stackTrace: error.stack
    })
  }
}

/**
 * Attaches all backend queue processing functions to their respective queues.
 * Registers up a failure callback.
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

  // Registers the failure callback
  for (const queueName in queues) {
    queues[queueName].on('failed', failureCallback)
  }
}

module.exports = {
  queues,
  runProcessors
}
