'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('shop_deployments', 'uuid', { 
        type: Sequelize.STRING
      })
      await queryInterface.addIndex('shop_deployments', ['uuid'])
    })
  },

  down: (queryInterface,) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeIndex('shop_deployments', ['uuid'])
      await queryInterface.removeColumn('shop_deployments', 'uuid')
    })
  }
}
