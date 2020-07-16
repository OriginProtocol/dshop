/**
 * @file Shows a UI for our queues.
 */

const { REDIS_URL } = require('../utils/const')
const { authSuperUser } = require('../routes/_auth')

/**
 * If we are not using bull for a queue, don't setup the UI for it.
 * @param {*} app
 */
function noUi(router) {
  router.get('/super-admin/queue', authSuperUser, function (req, res) {
    res.send('Redis is not configured. Queuing disabled.')
  })
}

/**
 * Use the bull board queue UI, and attach it to all our queues.
 * @param {*} app
 */
function bullBoardUI(router) {
  const { UI, setQueues } = require('bull-board')
  const queues = require('./queues')

  // Add all queues to the UI
  const allQueues = []
  for (const name of Object.keys(queues)) {
    const queue = queues[name]
    allQueues.push(queue)
  }
  setQueues(allQueues)

  // Use the UI
  router.use('/super-admin/queue', authSuperUser, UI)
}

module.exports = function (router) {
  if (REDIS_URL != undefined) {
    bullBoardUI(router)
  } else {
    noUi(router)
  }
}
