
const tableName = 'transactions'

const { TransactionTypes, TransactionStatuses } = require('../../enums')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.dropTable(tableName) // Note: this table was empty so it's fine to drop it.
      await queryInterface.createTable(tableName, {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        shop_id: Sequelize.INTEGER,
        network_id: Sequelize.INTEGER,
        from_address: Sequelize.STRING,
        to_address: Sequelize.STRING,
        type: Sequelize.ENUM(TransactionTypes),
        status: Sequelize.ENUM(TransactionStatuses),
        hash: Sequelize.STRING,
        block_number: Sequelize.INTEGER,
        ipfs_hash: Sequelize.STRING,
        listing_id: Sequelize.STRING,
        offer_id: Sequelize.STRING,
        job_id: Sequelize.STRING,
        custom_id: Sequelize.STRING,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })
      await queryInterface.addIndex(tableName, ['shop_id'])
      await queryInterface.addIndex(tableName, ['from_address'])
      await queryInterface.addIndex(tableName, ['hash'])
      await queryInterface.addIndex(tableName, ['offer_id'])
      await queryInterface.addIndex(tableName, ['job_id'])
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.dropTable(tableName)
      await queryInterface.createTable(tableName, {
        network_id: { type: Sequelize.INTEGER, unique: 'compositeIndex' },
        shop_id: Sequelize.INTEGER,
        transaction_hash: { type: Sequelize.STRING, unique: 'compositeIndex' },
        block_number: Sequelize.INTEGER
      })
    })
  }
}
