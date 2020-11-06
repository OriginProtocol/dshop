'use strict'

module.exports = {
  up: (queryInterface) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite'
    if (isSqlite) {
      return Promise.resolve()
    }

    return queryInterface.sequelize.query(
      `ALTER TYPE enum_discounts_discount_type ADD VALUE IF NOT EXISTS 'payment'`
    )
  },
  down: () => Promise.resolve()
}
