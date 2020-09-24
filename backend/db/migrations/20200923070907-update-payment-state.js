'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`
      ALTER TYPE enum_orders_payment_status ADD VALUE IF NOT EXISTS 'Pending';
    `).then(() => queryInterface.sequelize.query(`
      ALTER TYPE enum_orders_payment_status ADD VALUE IF NOT EXISTS 'Rejected';
    `))
  },

  down: () => {
    return Promise.resolve()
  }
}
