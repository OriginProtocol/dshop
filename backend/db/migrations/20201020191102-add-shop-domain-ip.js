'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('shop_domains', 'ip_address', { 
      type: Sequelize.STRING
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('shop_domains', 'ip_address')
  }
}
