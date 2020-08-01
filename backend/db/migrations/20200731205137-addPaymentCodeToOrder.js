'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('orders', 'payment_code', { type: Sequelize.STRING })
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('orders', 'payment_code')
    })
  }
}
