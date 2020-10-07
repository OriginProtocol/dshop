const tableName = 'admin_logs'

const { AdminLogActions } = require('../../enums')

module.exports = {
  up: (queryInterface, Sequelize) => {
    const isPostgres = queryInterface.sequelize.options.dialect === 'postgres'

    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.createTable(tableName, {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        action: Sequelize.ENUM(AdminLogActions),
        shop_id: Sequelize.INTEGER,
        seller_id: Sequelize.INTEGER,
        data: isPostgres ? Sequelize.JSONB : Sequelize.JSON,
        created_at: Sequelize.DATE,
      })
      await queryInterface.addIndex(tableName, ['shop_id'])
      await queryInterface.addIndex(tableName, ['seller_id'])
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(() => {
      queryInterface.dropTable(tableName)
    })
  }
}