'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addIndex('shops', ['hostname'], { unique: true })
      await queryInterface.addIndex('shops', ['auth_token'], { unique: true })
    })
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeIndex('shops', ['auth_token'])
      await queryInterface.removeIndex('shops', ['hostname'])
    })
  }
}
