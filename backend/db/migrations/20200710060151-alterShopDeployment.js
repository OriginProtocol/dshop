'use strict'

module.exports = {
  up: queryInterface => {
    return queryInterface.sequelize.query(`
      ALTER TABLE shop_deployments RENAME COLUMN ipfs_gateway TO ipfs_pinner;
    `)
  },
  down: queryInterface => {
    return queryInterface.sequelize.query(`
      ALTER TABLE shop_deployments RENAME COLUMN ipfs_pinner TO ipfs_gateway;
    `)
  }
}