const tableName = 'etl_jobs'

const { EtlJobStatuses } = require('../../enums')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async () => {
      await queryInterface.createTable(tableName, {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        status: Sequelize.ENUM(EtlJobStatuses),
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(() => {
      queryInterface.dropTable(tableName)
    })
  }
}