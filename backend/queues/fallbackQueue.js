const { getLogger } = require('../utils/logger')

const log = getLogger('queues.fallbackQueue')

/**
 * A fallback "queue" to use when redis is unavailable. It just runs
 * the queue's processing function immediately when you add a job.
 *
 * Thus, this this isn't actually a queue at all, and contains
 * no retries or error handling. But your job gets run.
 */
class FallbackQueue {
  /**
   * @param {*} name - name of queue
   * @param {object} opts - unused, here for compatibility only
   */
  constructor(name, opts) {
    this.name = name
    this.processor = undefined
    this.opts = opts
    this.eventHandlers = {}
  }

  /**
   * Adds a job to the queue. Job will be run immediately, and you
   * can `await` the job's completion if your processing function supports it.
   * @param {*} data
   */
  async add(data) {
    log.info(this.name + ' queue using inline queue processor fallback.')
    if (this.processor == undefined) {
      throw new Error('No processor defined for this fake job queue')
    }
    const job = {
      id: Date.now(),
      data: data,
      progress: () => undefined,
      log: log.info,
      queue: this
    }
    await this.processor(job)
    return job
  }

  /**
   * Registers your job processing function.
   * @param {function} fn - code the runs for each submitted job
   */
  process(fn) {
    this.processor = fn
  }

  /**
   * Do nothing stub
   */
  resume() {}

  /**
   * Do nothing stub
   */
  pause() {}

  /**
   * Fake job counts for health check
   */
  getJobCounts() {
    return {
      waiting: -1,
      active: -1,
      completed: -1,
      failed: -1,
      delayed: -1,
      paused: -1
    }
  }

  /**
   * Event handlers
   */
  on(name, cb) {
    // TODO: implement event triggers?  ref: https://github.com/OptimalBits/bull/blob/712df1db6f132fa8198745be298d2d8befa203b1/lib/queue.js#L328-L331
    this.eventHandlers[name] = cb
  }
}

module.exports = FallbackQueue
