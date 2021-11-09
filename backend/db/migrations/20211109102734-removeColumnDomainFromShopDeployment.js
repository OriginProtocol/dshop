'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeColumn('shop_deployments','domain')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shop_deployments','domain', Sequelize.STRING)
  }
}
