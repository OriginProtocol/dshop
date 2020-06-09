module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(() =>
      Promise.all([
        queryInterface.addColumn('external_payments', 'authenticated', {
          type: Sequelize.BOOLEAN
        }),
        queryInterface.addColumn('external_payments', 'type', {
          type: Sequelize.STRING
        }),
        queryInterface.addColumn('external_payments', 'payment_intent', {
          type: Sequelize.STRING
        }),
        queryInterface.addColumn('external_payments', 'currency', {
          type: Sequelize.STRING
        }),
        queryInterface.addColumn('external_payments', 'payment_code', {
          type: Sequelize.STRING
        }),
        queryInterface.removeColumn('external_payments', 'order_id')
      ])
    )
  },

  down: (queryInterface) => {
    Promise.all([
      queryInterface.removeColumn('external_payments', 'authenticated'),
      queryInterface.removeColumn('external_payments', 'type'),
      queryInterface.removeColumn('external_payments', 'payment_intent'),
      queryInterface.removeColumn('external_payments', 'payment_code'),
      queryInterface.removeColumn('external_payments', 'currency')
    ])
  }
}

