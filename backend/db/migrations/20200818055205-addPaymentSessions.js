const tableName = 'payment_sessions'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.createTable(tableName, {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        shop_id: Sequelize.INTEGER,
        from_address: Sequelize.STRING,
        to_address: Sequelize.STRING,
        amount: Sequelize.INTEGER,
        currency: Sequelize.STRING,
        code: Sequelize.STRING,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })
      await queryInterface.addIndex(tableName, ['shop_id'])
      await queryInterface.addIndex(tableName, ['code'])
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(() => {
      queryInterface.dropTable(tableName)
    })
  }
}