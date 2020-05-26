module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('external_payments', 'accepted', {
      type: Sequelize.BOOLEAN
    })
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('external_payments', 'accepted')
  }
}
