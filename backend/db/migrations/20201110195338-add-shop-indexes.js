'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addIndex('shops', ['hostname'])
      await queryInterface.addIndex('shops', ['auth_token'])
    })
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeIndex('shops', ['auth_token'])
      await queryInterface.removeIndex('shops', ['hostname'])
    })
  }
}
