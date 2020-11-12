'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.dropTable('external_orders')
      await queryInterface.dropTable('old_orders')
      await queryInterface.dropTable('shop_deployment_names')
    }) 
  },

  down: () => Promise.resolve()
}
