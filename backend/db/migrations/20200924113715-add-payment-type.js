'use strict'

const { OrderPaymentTypes } = require('../../enums')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('orders', 'payment_type', { 
      type: Sequelize.ENUM(OrderPaymentTypes)
    })
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('orders', 'payment_type')
  }
}
