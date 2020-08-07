'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('shops', 'wallet_address', { type: Sequelize.STRING })
      await queryInterface.addIndex('shops', ['wallet_address'])
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('shops', 'wallet_address')
    })
  }
}
