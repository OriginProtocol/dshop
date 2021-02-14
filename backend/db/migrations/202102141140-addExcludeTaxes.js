'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('discounts', 'exclude_taxes', { 
      type: Sequelize.BOOLEAN
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('discounts', 'exclude_taxes')
  }
}