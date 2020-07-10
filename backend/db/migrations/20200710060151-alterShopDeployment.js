'use strict'

module.exports = {
  up: queryInterface => {
    return queryInterface.sequelize.query(`
      ALTER TABLE shop_deployments RENAME COLUMN ipfs_gateway TO ipfs_pinner;
    `)
  },
  down: queryInterface => {
    if (queryInterface.sequelize.options.dialect === 'sqlite') return Promise.resolve()

    return queryInterface.sequelize.query(`
      ALTER TABLE shop_deployments RENAME COLUMN ipfs_pinner TO ipfs_gateway;
    `)
  }
}