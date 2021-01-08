'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('networks', 'use_marketplace', {
        type: Sequelize.BOOLEAN,
        defaultValue: false // by default disable the use of the marketplace.
      })
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('networks', 'use_marketplace')
    })
  }
}
