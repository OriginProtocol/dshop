'use strict'

const { PrintfulWebhookEvents } = require('../../utils/enums')

module.exports = {
  up: (queryInterface) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite'
    if (isSqlite) {
      return Promise.resolve()
    }

    return queryInterface.sequelize.query(
      `ALTER TYPE enum_external_events_event_type ADD VALUE IF NOT EXISTS '${PrintfulWebhookEvents.StockUpdated}'`
    )
  },
  down: () => Promise.resolve()
}
