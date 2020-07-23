
const tableName = 'transactions'

const { TransactionTypes, TransactionStatuses} = require('../../enums')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.addColumn(tableName, 'id', { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true })
      await queryInterface.addColumn(tableName, 'wallet', { type: Sequelize.STRING })
      await queryInterface.addColumn(tableName, 'type', { type: Sequelize.ENUM(TransactionTypes) })
      await queryInterface.addColumn(tableName, 'status', { type: Sequelize.ENUM(TransactionStatuses) })
      await queryInterface.addColumn(tableName, 'ipfs_hash', { type: Sequelize.STRING })
      await queryInterface.addColumn(tableName, 'listing_id', { type: Sequelize.STRING })
      await queryInterface.addColumn(tableName, 'offer_id', { type: Sequelize.STRING })
      await queryInterface.addColumn(tableName, 'job_id', { type: Sequelize.STRING })
      await queryInterface.addColumn(tableName, 'created_at', { type: Sequelize.DATE })
      await queryInterface.addColumn(tableName, 'updated_at', { type: Sequelize.DATE })

      await  queryInterface.sequelize.query(`ALTER TABLE ${tableName} RENAME COLUMN transaction_hash TO hash;`)

      await queryInterface.addIndex(tableName, ['shop_id'])
      await queryInterface.addIndex(tableName, ['hash'])
      await queryInterface.addIndex(tableName, ['listing_id'])
      await queryInterface.addIndex(tableName, ['offer_id'])
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.removeIndex(tableName, tableName + '_offer_id')
      await queryInterface.removeIndex(tableName, tableName + '_listing_id')
      await queryInterface.removeIndex(tableName, tableName + '_hash')
      await queryInterface.removeIndex(tableName, tableName + '_shop_id')

      await  queryInterface.sequelize.query(`ALTER TABLE ${tableName} RENAME COLUMN hash TO transaction_hash;`)

      await queryInterface.removeColumn(tableName, 'updated_at')
      await queryInterface.removeColumn(tableName, 'created_at')
      await queryInterface.removeColumn(tableName, 'job_id')
      await queryInterface.removeColumn(tableName, 'offer_id')
      await queryInterface.removeColumn(tableName, 'listing_id')
      await queryInterface.removeColumn(tableName, 'ipfs_hash')
      await queryInterface.removeColumn(tableName, 'status')
      await queryInterface.removeColumn(tableName, 'type')
      await queryInterface.removeColumn(tableName, 'wallet')
      await queryInterface.removeColumn(tableName, 'id')

      await queryInterface.sequelize.query(`DROP TYPE enum_${tableName}_type;`)
      await queryInterface.sequelize.query(`DROP TYPE enum_${tableName}_status;`)
    })
  }
}
