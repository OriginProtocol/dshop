'use strict'

const { OrderPaymentStatuses } = require('../../enums')

module.exports = {
  up: (queryInterface, Sequelize) => {
    const isPostgres = queryInterface.sequelize.options.dialect === 'postgres'

    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.sequelize.query(`ALTER TABLE orders RENAME TO old_orders;`)
      await queryInterface.createTable('orders', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        fq_id: Sequelize.STRING,
        short_id: Sequelize.STRING,
        shop_id: Sequelize.INTEGER,
        network_id: Sequelize.INTEGER,
        payment_status: Sequelize.ENUM(OrderPaymentStatuses),
        payment_code: Sequelize.STRING,
        ipfs_hash: Sequelize.STRING,
        encrypted_ipfs_hash: Sequelize.STRING,
        currency: Sequelize.STRING,
        total: Sequelize.STRING,
        data: isPostgres ? Sequelize.JSONB : Sequelize.JSON,
        offer_id: Sequelize.STRING,
        offer_status: Sequelize.STRING,
        referrer: Sequelize.STRING,
        commission_pending: Sequelize.INTEGER,
        commission_paid: Sequelize.INTEGER,
        created_block: Sequelize.INTEGER,
        updated_block: Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })
      await queryInterface.addIndex('orders', ['fq_id'])
      await queryInterface.addIndex('orders', ['shop_id', 'short_id'])
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.dropTable('orders')
      await queryInterface.sequelize.query(`ALTER TABLE old_orders RENAME orders;`)
    })
  }
}

