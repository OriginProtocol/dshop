module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.createTable('shop_deployment_names', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        ipfs_hash: Sequelize.STRING,
        hostname: Sequelize.STRING,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })

      await queryInterface.addIndex(
        'shop_deployment_names',
        {
          name: 'shop_deployment_names__ipfs_hash__hostname__idx',
          fields: ['ipfs_hash', 'hostname'],
          unique: true
        }
      )

      await queryInterface.sequelize.query(
        `SELECT DISTINCT domain, ipfs_hash FROM shop_deployments ` +
        `WHERE domain IS NOT NULL AND ipfs_hash IS NOT NULL;`
      ).then(rows => {
        if (rows && rows[0] && rows[0].length) {
          queryInterface.bulkInsert('shop_deployment_names', rows[0].map(rec => ({
            ipfs_hash: rec.ipfs_hash,
            hostname: rec.domain,
            created_at: new Date()
          })))
        }
      })
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(() => {
      queryInterface.dropTable('shop_deployment_names')
      queryInterface.removeIndex(
        'shop_deployment_names',
        'shop_deployment_names__ipfs_hash__hostname__idx'
      )
    })
  }
}
