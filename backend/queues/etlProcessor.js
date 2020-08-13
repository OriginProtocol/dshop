const { EtlJobProcessor } = require('../etl/processor')
const { getLogger } = require('../utils/logger')
const { Sentry } = require('../sentry')

const queues = require('./queues')

const logger = getLogger('queues.etlProcessor')

const attachToQueue = () => {
  const queue = queues['etlQueue']
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
    queueLog(0, 'Starting ETL job...')

    const etl = new EtlJobProcessor()
    await etl.run(job.data)

    queueLog(100, 'Finished')
  } catch (e) {
    // Log the exception and rethrow.
    Sentry.captureException(e)
    logger.error(`ETL failed:`, e)
    throw e
  }
}

/**
 * Adds a recurring task to the queue for running the ETL job.
 * Note: this only needs to be called once when setting up the ETL pipeline.
 *
 * @returns {Promise<string>} The repeatable job id.
 */
async function scheduleEtlJob() {
  const queue = queues['etlQueue']
  // Run daily at 17:00 UTC => ~10:00am PST
  const job = await queue.add(
    { task: 'etl' },
    { repeat: { cron: '00 17 * * *' } }
  )
  logger.info(`Scheduled ETL job ${job.id} to run daily.`)
  return job.id
}

module.exports = { processor, attachToQueue, scheduleEtlJob }
