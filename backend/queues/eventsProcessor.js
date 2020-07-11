const { handleLog } = require('../utils/handleLog')
const { getLogger } = require('../utils/logger')

const queues = require('./queues')
const logger = getLogger('queues.eventsProcessor')

const attachToQueue = () => {
  const queue = queues['eventsQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

const processor = async (job) => {
  const log = (progress, str) => {
    logger.debug(`[${progress}%] ${str}`)
    job.log(str)
    job.progress(progress)
  }

  log(10, 'Handling log...')

  await handleLog(job.data)

  log(100, 'Finished')
}

module.exports = { processor, attachToQueue }
