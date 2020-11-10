'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('discounts', 'min_cart_value', { 
        type: Sequelize.INTEGER,
        defaultValue: 0
      })
      await queryInterface.addColumn('discounts', 'max_discount_value', { 
        type: Sequelize.INTEGER
      })
    }) 

  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('discounts', 'min_cart_value')
      await queryInterface.removeColumn('discounts', 'max_discount_value')
    })
  }
}
