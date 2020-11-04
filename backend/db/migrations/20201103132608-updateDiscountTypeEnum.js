'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(
      `ALTER TYPE enum_discounts_discount_type ADD VALUE IF NOT EXISTS 'payment'`
    )
  },
  down: () => Promise.resolve()
}
