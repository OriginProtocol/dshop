'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    const isPostgres = queryInterface.sequelize.options.dialect === 'postgres'

    return queryInterface.createTable('external_events', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shop_id: {
        type: Sequelize.INTEGER,
        references: { model: 'shops', key: 'id' }
      },
      service: Sequelize.STRING,
      event_type: Sequelize.STRING,
      data: isPostgres ? Sequelize.JSONB : Sequelize.JSON,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE
    })
  },

  down: queryInterface => {
    return queryInterface.dropTable('external_events')
  }
}
