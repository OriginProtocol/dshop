// A table used to generate a payment code used for direct crypto payments.
// See API routes /crypto/payment-code and /crypto/payment.

module.exports = (sequelize, DataTypes) => {
  const PaymentSession = sequelize.define(
    'PaymentSession',
    {
      shopId: DataTypes.INTEGER, // Foreign key to shops.id
      fromAddress: DataTypes.STRING, // Address sending the payment.
      toAddress: DataTypes.STRING, // Address receiving the payment.
      amount: DataTypes.INTEGER, // Total amount as a fixed-point integer. For ex. $12.34 => 1234
      currency: DataTypes.STRING, // Payment currency. Ex: "USD".
      code: DataTypes.STRING // Randomly generated code that uniquely identifies the session
    },
    {
      underscored: true,
      tableName: 'payment_sessions'
    }
  )

  return PaymentSession
}
