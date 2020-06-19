const Logger = require('logplease')

const ROOT_NAME = 'dshop'

if (typeof process.env.LOG === 'undefined') {
  Logger.setLogLevel(process.env.LOG_LEVEL || 'INFO')
}

const isProd = process.env.NODE_ENV === 'production'

function getLogger(name) {
  name = name ? `${ROOT_NAME}.${name}` : ROOT_NAME

  return Logger.create(name, {
    showTimestamp: !isProd,
    useColors: !isProd
  })
}

const rootLogger = getLogger()
const apiLogger = getLogger('dshop.api')
const listenerLogger = getLogger('dshop.listener')

module.exports = {
  getLogger,
  rootLogger,
  apiLogger,
  listenerLogger
}
