'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn('shop_deployments', 'bucket_urls', { 
        type: Sequelize.STRING
      })
      await queryInterface.addColumn('shop_deployments', 'bucket_http_urls', { 
        type: Sequelize.STRING
      })
    })
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeColumn('shop_deployments', 'bucket_urls')
      await queryInterface.removeColumn('shop_deployments', 'bucket_http_urls')
    })
  }
}
