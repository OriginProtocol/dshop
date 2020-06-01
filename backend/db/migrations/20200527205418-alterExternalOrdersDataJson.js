'use strict'

module.exports = {
  up: queryInterface => {
    // For sqlite, the column was already created as JSON.
    if (queryInterface.sequelize.options.dialect === 'sqlite') return Promise.resolve()
    return queryInterface.sequelize.query(`
      ALTER TABLE external_orders ALTER COLUMN data TYPE JSONB USING data::json;
    `)
  },
  down: queryInterface => {
    if (queryInterface.sequelize.options.dialect === 'sqlite') return Promise.resolve()

    return queryInterface.sequelize.query(`
      ALTER TABLE external_orders ALTER COLUMN data TYPE TEXT;
    `)
  }
}
