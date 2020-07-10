'use strict'

const { PrintfulWebhookEvents, ExternalServices } = require('../../utils/enums')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('external_events', 'event_type', {
        type: Sequelize.ENUM(...Object.values(PrintfulWebhookEvents))
      }),
      queryInterface.changeColumn('external_events', 'service', {
        type: Sequelize.ENUM(...Object.values(ExternalServices))
      })
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('external_events', 'event_type', {
        type: Sequelize.STRING
      }),
      queryInterface.changeColumn('external_events', 'service', {
        type: Sequelize.STRING
      }),
    ])
  }
}
