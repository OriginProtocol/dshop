'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('active', 'etl_shops', { type: Sequelize.BOOLEAN, })
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('active', 'etl_shops')
    })
  }
}

