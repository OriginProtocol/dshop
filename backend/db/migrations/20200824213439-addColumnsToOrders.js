'use strict'

const { OrderStatuses } = require('../../enums')


module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('orders', 'offer_id', { type: Sequelize.STRING })
      await queryInterface.removeColumn('orders', 'status')
      await queryInterface.addColumn('orders', 'status', { type: Sequelize.ENUM(OrderStatuses) })
      return queryInterface.sequelize.query(`ALTER TABLE orders RENAME COLUMN status_str TO offer_status;`)
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.sequelize.query(`ALTER TABLE orders RENAME COLUMN offer_status TO status_str;`)
      await queryInterface.removeColumn('orders', 'status')
      await queryInterface.addColumn('orders', 'status', { type: Sequelize.STRING })
      await queryInterface.removeColumn('orders', 'offer_id')
    })
  }
}
