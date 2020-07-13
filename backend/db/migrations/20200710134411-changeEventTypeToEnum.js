'use strict'

const { PrintfulWebhookEvents, ExternalServices } = require('../../utils/enums')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('external_events', 'event_type', {
      type: Sequelize.ENUM(...Object.values(PrintfulWebhookEvents))
    })
    await queryInterface.changeColumn('external_events', 'service', {
      type: Sequelize.ENUM(...Object.values(ExternalServices))
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('external_events', 'event_type', {
      type: Sequelize.STRING
    })
    await queryInterface.changeColumn('external_events', 'service', {
      type: Sequelize.STRING
    })
  }
}
