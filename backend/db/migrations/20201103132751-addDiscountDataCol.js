'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    const isPostgres = queryInterface.sequelize.options.dialect === 'postgres'

    return queryInterface.addColumn('discounts', 'data', { 
      type: isPostgres ? Sequelize.JSONB : Sequelize.JSON
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('discounts', 'data')
  }
}
