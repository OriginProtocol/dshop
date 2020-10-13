const get = require('lodash/get')

const {
  OrderPaymentStatuses,
  OrderOfferStatuses,
  OrderPaymentTypes
} = require('../enums')

module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const Order = sequelize.define(
    'Order',
    {
      shopId: DataTypes.INTEGER,
      // Ethereum network id. 1=Mainnet, 4=Rinkeby, 999=local
      networkId: DataTypes.INTEGER,
      // Fully qualified order id. Format: <network_id>-<marketplace_version>-<listing_id>-<shop_id>-<randomId>.
      fqId: DataTypes.STRING,
      // A short id that can be exposed externally and should be used as a "reference id" by buyers and merchants to refer to an order.
      shortId: DataTypes.STRING,
      // Current status of the order.
      paymentStatus: DataTypes.ENUM(OrderPaymentStatuses),
      // Type of payment made
      paymentType: DataTypes.ENUM(OrderPaymentTypes),
      // Optional. Links an external payment (ex: credit card) to an order. See external_payments.payment_code
      paymentCode: DataTypes.STRING,
      // IPFS hash for the offer data.
      ipfsHash: DataTypes.STRING,
      // IPFS hash of the encrypted offer data.
      encryptedIpfsHash: DataTypes.STRING,
      // Blockchain fully-qualified offerId. Only populated for on-chain offers.
      offerId: DataTypes.STRING,
      // Marketplace offer status: OfferCreated/Accepted/Finalized/Withdrawn/Disputed. Only populated for on-chain offers.
      offerStatus: DataTypes.ENUM(OrderOfferStatuses),
      // Block number at which the offer was created. Only populated for on-chain offers.
      createdBlock: DataTypes.INTEGER,
      // Block number of the most recent offer update. Only populated for on-chain offers.
      updatedBlock: DataTypes.INTEGER,
      // Currency symbol. For ex.: USD
      currency: DataTypes.STRING,
      // Total amount as a fixed-point integer. For ex.: $12.34 => 1234
      total: DataTypes.STRING,
      // Details about the order: Item bought, Buyer address, phone and email, etc...
      // Note: Postgres supports JSONB while sqlite only supports JSON.
      data: isPostgres ? DataTypes.JSONB : DataTypes.JSON,
      // Checksummed ETH address of the referrer.
      referrer: DataTypes.TEXT,
      // Amount of OGN commission owed to the referrer.
      commissionPending: DataTypes.INTEGER,
      // Amount of OGN commission paid to the referrer.
      commissionPaid: DataTypes.INTEGER,
      // Hides the order in frontend
      archived: DataTypes.BOOLEAN,
      // Date at which the order was recorded, either on or off-chain.
      createdAt: DataTypes.DATE
    },
    {
      underscored: true,
      tableName: 'orders',
      hooks: {
        // Lower cases the email address of the buyer before storing the order in the DB.
        beforeCreate(order) {
          const userEmail = get(order, 'data.userInfo.email')
          if (userEmail) {
            order = {
              ...order,
              data: {
                ...order.data,
                userInfo: {
                  ...order.data.userInfo,
                  email: userEmail.toLowerCase()
                }
              }
            }
          }
        }
      }
    }
  )

  Order.associate = function (models) {
    Order.belongsTo(models.Shop, { as: 'shops', foreignKey: 'shopId' })
  }

  return Order
}
