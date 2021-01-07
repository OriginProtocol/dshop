const discordWebhook = require('../utils/discordWebhook')
const queues = require('./queues')
const get = require('lodash/get')

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
    discordWebhook.postQueueError({
      queueName: job.queue.name,
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
