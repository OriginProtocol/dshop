const { triggerAutoSSL } = require('../utils/autossl')
const { getLogger } = require('../utils/logger')

const queues = require('./queues')
const logger = getLogger('queues.autosslProcessor')

const attachToQueue = () => {
  const queue = queues['autosslQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

const processor = async (job) => {
  const log = (progress, str) => {
    logger.debug(`[${progress}%] ${str}`)
    job.log(str)
    job.progress(progress)
  }

  log(10, 'Making request AutoSSL priming request...')

  const success = await triggerAutoSSL(job.data.url, job.data.host)

  if (!success) {
    const errMsg = 'AutoSSL priming failed'
    logger.error(errMsg)
    throw new Error(errMsg)
  }

  log(100, 'Finished')
}

module.exports = { processor, attachToQueue }
