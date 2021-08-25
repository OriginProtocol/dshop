'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.createTable('policies', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true
        },
        shop_id: {
          type: Sequelize.INTEGER,
          unique: true
        },
        all_policies: {
          type: Sequelize.JSON
        },
        created_at: {
          type: Sequelize.DATE
        },
        updated_at: {
          type: Sequelize.DATE
        }
      })
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.dropTable('policies')
    })
  }
}
