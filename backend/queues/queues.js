/**
 * @file Queue objects for adding processing dshop jobs.
 *
 * If no REDIS_URL defined, will fallback to processing jobs as the jobs are
 * submitted, without using a queue.
 *
 * Example REDIS_URL=redis://0.0.0.0:6379
 */
const { REDIS_URL } = require('../utils/const')
const { getLogger } = require('../utils/logger')

const Queue = REDIS_URL ? require('bull') : require('./fallbackQueue')
const backendUrl = REDIS_URL ? REDIS_URL : undefined
const queueOpts = {}
const log = getLogger('queues.queues')

if (REDIS_URL) {
  log.info(`Queue init: Using Redis at ${REDIS_URL}`)
} else {
  log.info('Queue init: REDIS_URL not set, using in-memory queue.')
}

const all = [
  new Queue('makeOffer', backendUrl, {
    prefix: '{makeOffer}',
    defaultJobOptions: {
      // Up to 6 attempts to process the job, using an exponential backoff
      // having a 60 sec initial delay.
      attempts: 6,
      backoff: {
        type: 'exponential',
        delay: 60000
      }
    }
  }),
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
  new Queue('tx', backendUrl, {
    prefix: '{tx}',
    defaultJobOptions: {
      // Up to 4 attempts to process the job, using an exponential backoff
      // having a 15 sec initial delay.
      attempts: 4,
      backoff: {
        type: 'exponential',
        delay: 15000
      }
    }
  }),
  new Queue(
    'dns',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{dns}'
    })
  ),
  new Queue(
    'deployment',
    backendUrl,
    Object.assign(queueOpts, {
      prefix: '{deployment}'
    })
  )
]

module.exports = {}
for (const queue of all) {
  module.exports[`${queue.name}Queue`] = queue
}
