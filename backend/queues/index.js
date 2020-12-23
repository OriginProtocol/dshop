const discordWebhook = require('../utils/discordWebhook')
const queues = require('./queues')

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
      attempts: job.attemptsMade,
      stacktrace: error.trace
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
