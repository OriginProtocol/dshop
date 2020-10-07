// An append-only table for recording shop admins activity.

const { AdminLogActions } = require('../enums')

module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const AdminLog = sequelize.define(
    'AdminLog',
    {
      action: DataTypes.ENUM(AdminLogActions), // The type of action performed.
      shopId: DataTypes.INTEGER, // The shop the action was applied to.
      sellerId: DataTypes.INTEGER, // The user that initiated the action.
      data: isPostgres ? DataTypes.JSONB : DataTypes.JSON, // Data related to the action.
      createdAt: DataTypes.DATE
    },
    {
      underscored: true,
      timestamps: false,
      tableName: 'admin_logs'
    }
  )

  return AdminLog
}
