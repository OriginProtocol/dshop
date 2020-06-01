module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const ExternalOrder = sequelize.define(
    'ExternalOrder',
    {
      id: {
        type: DataTypes.INTEGER,
        unique: true,
        primaryKey: true
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      external_id: DataTypes.STRING,
      order_id: DataTypes.STRING,
      // Note: Postgres supports JSONB while sqlite only supports JSON.
      data: isPostgres ? DataTypes.JSONB : DataTypes.JSON,
      payment_at: DataTypes.DATE,
      amount: DataTypes.INTEGER,
      fee: DataTypes.INTEGER,
      net: DataTypes.INTEGER
    },
    {
      underscored: true,
      tableName: 'external_orders'
    }
  )

  ExternalOrder.associate = function (models) {
    ExternalOrder.belongsTo(models.Order, {
      as: 'externalOrders',
      foreignKey: 'orderId'
    })
  }

  return ExternalOrder
}
