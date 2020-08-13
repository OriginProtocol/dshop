module.exports = (sequelize, DataTypes) => {
  const EtlShop = sequelize.define(
    'EtlShop',
    {
      jobId: DataTypes.INTEGER, // Foreign key to etl_jobs.id
      shopId: DataTypes.INTEGER, // Foreign key to shops.id
      numProducts: DataTypes.INTEGER, // Total number of products.
      numCollections: DataTypes.INTEGER, // Total number of collections.
      numDiscounts: DataTypes.INTEGER, // Total number of discounts.
      numShippings: DataTypes.INTEGER, // Total number of shipping options.
      numOrders: DataTypes.INTEGER, // Total number of orders processed.
      crypto: DataTypes.BOOLEAN, // True if a wallet is connected.
      stripe: DataTypes.BOOLEAN, // True if Stripe is activated.
      paypal: DataTypes.BOOLEAN, // True if PayPal is activated.
      uphold: DataTypes.BOOLEAN, // True if Uphold is activated.
      manualPayment: DataTypes.BOOLEAN, // True if manual payment(s) enabled.
      printful: DataTypes.BOOLEAN, // True if Printful activated.
      sendgrid: DataTypes.BOOLEAN, // True if Sendgrid email activated.
      aws: DataTypes.BOOLEAN, // True if AWS email activated.
      mailgun: DataTypes.BOOLEAN, // True if Mailgun email activated.
      published: DataTypes.BOOLEAN, // True if the shop go published successfully at least once.
      customDomain: DataTypes.BOOLEAN // True if a custom domain is setup.
    },
    {
      underscored: true,
      tableName: 'etl_shops'
    }
  )

  return EtlShop
}
