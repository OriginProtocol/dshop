'use strict'

module.exports = {
  up: (queryInterface) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite'
    if (isSqlite) {
      return Promise.resolve()
    }

    return queryInterface.sequelize.query(`
      ALTER TYPE enum_transactions_type ADD VALUE IF NOT EXISTS 'Payment';
    `)
  },
  down: () => {
    return Promise.resolve()
  }
}