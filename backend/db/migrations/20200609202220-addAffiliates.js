module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(() => {
      queryInterface.createTable('affiliates', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        account: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        first_name: Sequelize.STRING,
        last_name: Sequelize.STRING,
        email: Sequelize.STRING,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
      })
    })
  },
  down: queryInterface => {
    return queryInterface.sequelize.transaction(() => {
      queryInterface.dropTable('affiliates')
    })
  }
}
