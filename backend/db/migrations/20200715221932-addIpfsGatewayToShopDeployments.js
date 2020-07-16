'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shop_deployments', 'ipfs_gateway', {
      type: Sequelize.STRING,
    })
  },

  down: queryInterface => {
    return queryInterface.removeColumn('shop_deployments', 'ipfs_gateway')
  }
}