'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.createTable('policies', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        authToken: { type: Sequelize.STRING },
        allPolicies: {
          type: Sequelize.JSON
          // TODO: include 'defaultValue' key?
        }
      })
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.dropTable('policies')
    })
  }
}
