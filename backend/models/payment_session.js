module.exports = (sequelize, DataTypes) => {
  const PaymentSession = sequelize.define(
    'PaymentSession',
    {
      shopId: DataTypes.INTEGER, // Foreign key to shops.id
      fromAddress: DataTypes.STRING, // Address sending the payment.
      toAddress: DataTypes.STRING, // Address receiving the payment.
      amount: DataTypes.INTEGER, // Total number of discounts.
      currency: DataTypes.STRING // Payment currency.
    },
    {
      underscored: true,
      tableName: 'payment_sessions'
    }
  )

  return PaymentSession
}
