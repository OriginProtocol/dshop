const Sentry = require('@sentry/node')
const sentryEventPrefix =
  'https://sentry.io/organizations/origin-protocol/projects/dshop-backend/events'

const { getLogger } = require('./utils/logger')
const log = getLogger('sentry')

const dsn = process.env.SENTRY_DSN
const environment = process.env.ENVIRONMENT || 'development'

if (dsn) {
  log.info(`Initializing Sentry with environment: ${environment}`)
  Sentry.init({ dsn, environment })
} else {
  if (environment === 'development') {
    log.info('Skipping Sentry initialization')
  } else {
    log.error('Sentry initialization failed. SENTRY_DSN is not defined.')
  }
}

module.exports = {
  Sentry,
  sentryEventPrefix
}
