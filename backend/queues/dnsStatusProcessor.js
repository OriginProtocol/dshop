const { getLogger } = require('../utils/logger')
const { Sentry } = require('../sentry')
const { ShopDomain, Shop } = require('../models')
const { ShopDomainStatuses } = require('../enums')
const { verifyDNS } = require('../utils/dns/index')

const queues = require('./queues')

const logger = getLogger('queues.etlProcessor')

const attachToQueue = () => {
  const queue = queues['dns']
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
    queueLog(0, 'Starting DNS verification job...')

    const pendingVerifications = await ShopDomain.findAll({
      where: {
        status: ShopDomainStatuses.Pending
      },
      limit: 100,
      include: [Shop],
      order: [['createdAt', 'desc']]
    })

    for (const shopDomain of pendingVerifications) {
      const { valid } = await verifyDNS(
        shopDomain.domain,
        shopDomain.shop.hostname,
        shopDomain.shop.networkId,
        shopDomain.shop
      )

      if (valid) {
        await shopDomain.update({
          status: ShopDomainStatuses.Success
        })
      }
    }

    queueLog(100, 'Finished')
  } catch (e) {
    // Log the exception and rethrow.
    Sentry.captureException(e)
    logger.error(`Job failed:`, e)
    throw e
  }
}

/**
 * Adds a recurring task to the queue for running the job.
 * Note: this only needs to be called once when setting up.
 *
 * @returns {Promise<string>} The repeatable job id.
 */
async function scheduleDNSVerificationJob() {
  const queue = queues['dnsQueue']
  // Run daily at 17:00 UTC => ~10:00am PST
  const job = await queue.add(
    { task: 'dns' },
    { repeat: { cron: '00 */2 * * *' } }
  )
  logger.info(
    `Scheduled DNS status verification job ${job.id} to run once every two hours.`
  )
  return job.id
}

module.exports = { processor, attachToQueue, scheduleDNSVerificationJob }
