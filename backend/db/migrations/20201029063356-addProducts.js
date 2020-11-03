const tableName = 'products'

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
        product_id: Sequelize.STRING,
        stock_left: Sequelize.INTEGER,
        variants_stock: isPostgres ? Sequelize.JSONB : Sequelize.JSON,
        shop_id: Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })
      await queryInterface.addIndex(tableName, ['shop_id'])
      await queryInterface.addConstraint(tableName, ['shop_id', 'product_id'], {
        type: 'unique',
        name: 'shop_product_composite_index'
      })
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(() => {
      queryInterface.dropTable(tableName)
    })
  }
}