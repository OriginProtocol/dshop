'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    const isSQLite = queryInterface.sequelize.options.dialect === 'sqlite'
   
    return Promise.all([
      queryInterface.addColumn('sellers', 'email_verified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }),
      queryInterface.addColumn('sellers', 'data', {
        type: isSQLite ? Sequelize.JSON : Sequelize.JSONB,
        defaultValue: {}
      })
    ])
  },

  down: queryInterface => {
    return Promise.all([
      queryInterface.removeColumn('sellers', 'email_verified'),
      queryInterface.removeColumn('sellers', 'data')
    ])
  }
}
