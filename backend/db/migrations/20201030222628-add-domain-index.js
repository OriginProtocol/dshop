'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addIndex('shop_domains', ['domain'])
  },

  down: (queryInterface) => {
    return queryInterface.removeIndex('shop_domains', ['domain'])
  }
}
