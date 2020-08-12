const tableName = 'etl_shops'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.createTable(tableName, {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        job_id: Sequelize.INTEGER,
        shop_id: Sequelize.INTEGER,
        num_products: Sequelize.INTEGER,
        num_collections: Sequelize.INTEGER,
        num_discounts: Sequelize.INTEGER,
        num_shippings: Sequelize.INTEGER,
        num_orders: Sequelize.INTEGER,
        crypto: Sequelize.BOOLEAN,
        stripe: Sequelize.BOOLEAN,
        paypal: Sequelize.BOOLEAN,
        uphold: Sequelize.BOOLEAN,
        manual_payment: Sequelize.BOOLEAN,
        printful: Sequelize.BOOLEAN,
        sendgrid: Sequelize.BOOLEAN,
        aws: Sequelize.BOOLEAN,
        mailgun: Sequelize.BOOLEAN,
        published: Sequelize.BOOLEAN,
        custom_domain: Sequelize.BOOLEAN,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })
      await queryInterface.addIndex(tableName, ['job_id'])
      await queryInterface.addIndex(tableName, ['shop_id'])
      await queryInterface.addIndex(tableName, ['created_at'])
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(() => {
      queryInterface.dropTable(tableName)
    })
  }
}