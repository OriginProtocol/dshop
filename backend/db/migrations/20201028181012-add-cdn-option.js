'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shops', 'enable_cdn', { 
      type: Sequelize.BOOLEAN,
      defaultValue: false
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('shops', 'enable_cdn')
  }
}
