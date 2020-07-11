/**
 * @file Queue objects for adding processing dshop jobs.
 *
 * If no REDIS_URL defined, will fallback to prossing jobs as the jobs are
 * submitted, without using a queue.
 *
 * Example REDIS_URL=redis://0.0.0.0:6379
 */

const { REDIS_URL } = require('../utils/const')

const Queue = REDIS_URL ? require('bull') : require('./fallbackQueue')
const backendUrl = REDIS_URL ? REDIS_URL : undefined
const queueOpts = {}

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
  )
]

module.exports = {}
for (const queue of all) {
  module.exports[`${queue.name}Queue`] = queue
}
