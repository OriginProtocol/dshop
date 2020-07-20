const { handleLog } = require('../utils/handleLog')
const { getLogger } = require('../utils/logger')
const { Sentry } = require('../sentry')

const queues = require('./queues')

const logger = getLogger('queues.eventsProcessor')

const attachToQueue = () => {
  const queue = queues['eventsQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

const processor = async (job) => {
  const queueLog = (progress, str) => {
    logger.debug(`[${progress}%] ${str}`)
    job.log(str)
    job.progress(progress)
  }

  try {
    queueLog(10, 'Handling log...')

    await handleLog(job.data)

    queueLog(100, 'Finished')
  } catch (e) {
    // Log the exception and rethrow so that the job gets retried.
    Sentry.captureException(e)
    logger.error(`Log handler failed:`, e)
    throw e
  }
}

module.exports = { processor, attachToQueue }
