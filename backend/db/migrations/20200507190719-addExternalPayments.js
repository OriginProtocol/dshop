module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(() => {
      const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite'

      return Promise.all([
        queryInterface.createTable('external_payments', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
          },
          created_at: Sequelize.DATE,
          updated_at: Sequelize.DATE,
          external_id: Sequelize.STRING,
          order_id: Sequelize.STRING,
          // Note: In production we use Postgres and this was originally TEXT, then later altered to
          // JSON using a migration. For sqlite, since it does not allow to alter a column type
          // once it has been defined and since it is only used in development environments,
          // we create the column as JSON in the first place and the migration gets skipped.
          data: isSqlite ? Sequelize.JSON : Sequelize.TEXT,
          payment_at: Sequelize.DATE,
          amount: Sequelize.INTEGER,
          fee: Sequelize.INTEGER,
          net: Sequelize.INTEGER
        }),
        queryInterface.createTable('external_orders', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
          },
          created_at: Sequelize.DATE,
          updated_at: Sequelize.DATE,
          ordered_at: Sequelize.DATE,
          external_id: Sequelize.STRING,
          order_id: Sequelize.STRING,
          // Note: In production we use Postgres and this was originally TEXT, then later altered to
          // JSON using a migration. For sqlite, since it does not allow to alter a column type
          // once it has been defined and since it is only used in development environments,
          // we create the column as JSON in the first place and the migration gets skipped.
          data: isSqlite ? Sequelize.JSON : Sequelize.TEXT,
          amount: Sequelize.INTEGER
        })
      ])
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(() => {
      return Promise.all([
        queryInterface.dropTable('external_payments'),
        queryInterface.dropTable('external_orders')
      ])
    })
  }
}
