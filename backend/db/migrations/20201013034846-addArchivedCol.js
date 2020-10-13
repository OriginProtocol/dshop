'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('orders', 'archived', {
      type: Sequelize.BOOLEAN,
      defaultValue: false // by default, show everything
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('orders', 'archived')
  }
}
