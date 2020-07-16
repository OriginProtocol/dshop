'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('networks', 'public_signups', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    })
  },

  down: queryInterface => {
    return queryInterface.removeColumn('networks', 'public_signups')
  }
}
