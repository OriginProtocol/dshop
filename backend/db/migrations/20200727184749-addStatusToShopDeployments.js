'use strict'

const { ShopDeploymentStatuses } = require('../../enums')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('shop_deployments', 'status', { type: Sequelize.ENUM(ShopDeploymentStatuses) })
      await queryInterface.addColumn('shop_deployments', 'error', { type: Sequelize.STRING })
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('shop_deployments', 'error')
      await queryInterface.removeColumn('shop_deployments', 'status')
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_shop_deployments_status";')
    })
  }
}
