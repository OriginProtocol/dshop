const queues = require('./queues')

/**
 * Attaches all backend queue processing functions to their respective queues.
 */
function runProcessors() {
  require('./makeOfferProcessor').attachToQueue()
  require('./printfulSyncProcessor').attachToQueue()
}

module.exports = {
  queues,
  runProcessors
}
