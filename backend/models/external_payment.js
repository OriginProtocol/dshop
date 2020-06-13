module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const ExternalPayment = sequelize.define(
    'ExternalPayment',
    {
      id: {
        type: DataTypes.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      payment_at: DataTypes.DATE,
      external_id: DataTypes.STRING,
      // Note: Postgres supports JSONB while sqlite only supports JSON.
      data: isPostgres ? DataTypes.JSONB : DataTypes.JSON,
      amount: DataTypes.INTEGER,
      fee: DataTypes.INTEGER,
      net: DataTypes.INTEGER,
      currency: DataTypes.STRING,
      // Was this a valid transaction from the payment processor
      authenticated: DataTypes.BOOLEAN,
      paymentIntent: DataTypes.STRING,
      paymentCode: DataTypes.STRING,
      type: DataTypes.STRING
    },
    {
      underscored: true,
      tableName: 'external_payments'
    }
  )

  ExternalPayment.associate = function (models) {
    ExternalPayment.belongsTo(models.Order, {
      as: 'externalPayments',
      foreignKey: 'orderId'
    })
  }

  return ExternalPayment
}
