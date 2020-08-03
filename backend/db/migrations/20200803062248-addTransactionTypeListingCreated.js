'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`
      ALTER TYPE enum_transactions_type ADD VALUE IF NOT EXISTS 'ListingCreated';
    `)
  },
  down: () => {
    return Promise.resolve()
  }
}
