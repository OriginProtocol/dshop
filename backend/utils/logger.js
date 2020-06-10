const Logger = require('logplease')

Logger.setLogLevel(process.env.LOG_LEVEL || 'INFO')

const apiLogger = Logger.create('api', {
  showTimestamp: false
})

const listenerLogger = Logger.create('listener', {
  showTimestamp: false
})

module.exports = {
  apiLogger,
  listenerLogger
}