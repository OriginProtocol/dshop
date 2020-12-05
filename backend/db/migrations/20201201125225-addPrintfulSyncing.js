'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shops', 'printful_syncing', { 
      type: Sequelize.BOOLEAN
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('shops', 'printful_syncing')
  }
}
