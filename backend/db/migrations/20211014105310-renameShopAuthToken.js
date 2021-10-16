'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeIndex('shops', ['auth_token'])
      await queryInterface.renameColumn('shops', 'auth_token', 'shop_slug')
      await queryInterface.addIndex('shops', ['shop_slug'], { unique: true })
    })
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      /*
      Reverting commands to execute if and when any of the methods in the migration (ie. 'up') throws an error
      */
      await queryInterface.removeIndex('shops', ['shop_slug'])
      await queryInterface.renameColumn('shops', 'shop_slug', 'auth_token')
      await queryInterface.addIndex('shops', ['auth_token'], { unique: true })
    })
  }
}
