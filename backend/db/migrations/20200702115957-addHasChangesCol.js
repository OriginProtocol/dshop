'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shops', 'has_changes', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    })
  },

  down: queryInterface => {
    return queryInterface.removeColumn('shops', 'has_changes')
  }
}
