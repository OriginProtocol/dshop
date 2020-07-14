const Sentry = require('@sentry/node')
const sentryEventPrefix =
  'https://sentry.io/organizations/origin-protocol/projects/squad-deals-api/events'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT || 'development'
})

module.exports = {
  Sentry,
  sentryEventPrefix
}
