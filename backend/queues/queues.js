/**
 * @file Queue objects for adding processing dshop jobs.
 *
 * If no REDIS_URL defined, will fallback to processing jobs as the jobs are
 * submitted, without using a queue.
 *
 * Example REDIS_URL=redis://0.0.0.0:6379
 */
const { Sentry } = require('../sentry')
const { REDIS_URL } = require('../utils/const')
const { getLogger } = require('../utils/logger')

const Queue = REDIS_URL ? require('bull') : require('./fallbackQueue')
const backendUrl = REDIS_URL ? REDIS_URL : undefined
const queueOpts = {}
const log = getLogger('queues.queues')

// Capture in Sentry the failure of any job from these queues.
const CAPTURE_FAILED_QUEUES = ['autossl', 'etl', 'tx']

if (REDIS_URL) {
  log.info(`Queue init: Using Redis at ${REDIS_URL}`)
} else {
  log.info('Queue init: REDIS_URL not set, using in-memory queue.')
}

const all = [
  new Queue(
    'makeOffer',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{makeOffer}'
    })
  ),
  new Queue(
    'download',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{download}'
    })
  ),
  new Queue(
    'discord',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{discord}'
    })
  ),
  new Queue(
    'email',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{email}',
      maxStalledCount: 0 // We don't want to risk sending an email twice
    })
  ),
  new Queue(
    'printfulSync',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{printfulSync}'
    })
  ),
  new Queue(
    'events',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{events}'
    })
  ),
  new Queue(
    'autossl',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{autossl}'
    })
  ),
  new Queue(
    'etl',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{etl}'
    })
  ),
  new Queue(
    'tx',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{tx}'
    })
  ),
  new Queue(
    'dns',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{dns}'
    })
  )
]

all.forEach((q) => {
  if (CAPTURE_FAILED_QUEUES.includes(q.name)) {
    q.on('failed', function (job, err) {
      Sentry.captureException(err)
      log.error(`Job ${job.id} failed with error: ${err.toString()}`)
    })
  }
})

module.exports = {}
for (const queue of all) {
  module.exports[`${queue.name}Queue`] = queue
}
