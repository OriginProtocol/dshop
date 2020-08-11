const { EtlProcessor } = require('../etl/processor')
const { getLogger } = require('../utils/logger')
const { Sentry } = require('../sentry')

const queues = require('./queues')

const logger = getLogger('queues.etlProcessor')

const attachToQueue = () => {
  const queue = queues['etlQueue']
  queue.process(processor)
  // Schedule job to run daily at 20:00UTC
  queue.add({ task: 'main' }, { repeat: { cron: '00 20 * * *' } })
  logger.info('Scheduled ETL job to run daily.')
}

const processor = async (job) => {
  const queueLog = (progress, str) => {
    logger.debug(`[${progress}%] ${str}`)
    job.log(str)
    job.progress(progress)
  }

  try {
    queueLog(0, 'Starting ETL job...')

    const etl = new EtlProcessor()
    await etl.run(job.data)

    queueLog(100, 'Finished')
  } catch (e) {
    // Log the exception and rethrow.
    Sentry.captureException(e)
    logger.error(`ETL failed:`, e)
    throw e
  }
}

module.exports = { processor, attachToQueue }
