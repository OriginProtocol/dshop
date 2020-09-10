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
        fqId: Sequelize.STRING,
        shortId: Sequelize.STRING,
        shopId: Sequelize.INTEGER,
        networkId: Sequelize.INTEGER,
        paymentStatus: Sequelize.ENUM(OrderPaymentStatuses),
        paymentCode: Sequelize.STRING,
        ipfsHash: Sequelize.STRING,
        encryptedIpfsHash: Sequelize.STRING,
        currency: Sequelize.STRING,
        value: Sequelize.STRING,
        data: isPostgres ? Sequelize.JSONB : Sequelize.JSON,
        offerId: Sequelize.STRING,
        offerStatus: Sequelize.STRING,
        createdBlock: Sequelize.INTEGER,
        updatedBlock: Sequelize.INTEGER,
        referrer: Sequelize.STRING,
        commissionPending: Sequelize.INTEGER,
        commissionPaid: Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })
      await queryInterface.addIndex('orders', ['fqId'])
      await queryInterface.addIndex('orders', ['shopId', 'shortId'])
    })
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.dropTable('orders')
      await queryInterface.sequelize.query(`ALTER TABLE old_orders RENAME orders;`)
    })
  }
}

