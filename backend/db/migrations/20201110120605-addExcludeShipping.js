'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('discounts', 'exclude_shipping', { 
      type: Sequelize.BOOLEAN
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('discounts', 'exclude_shipping')
  }
}

