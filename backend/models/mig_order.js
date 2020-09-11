// Model used during the off-chain migration.
// Will get deleted once the migration is done.
// Only difference with the Order model is that it allows to set the createdAt timestamp.

const { OrderPaymentStatuses, OrderOfferStatuses } = require('../enums')

module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const MigOrder = sequelize.define(
    'MigOrder',
    {
      shopId: DataTypes.INTEGER,
      // Ethereum network id. 1=Mainnet, 4=Rinkeby, 999=local
      networkId: DataTypes.INTEGER,
      // Fully qualified order id. Format: <network_id>-<marketplace_version>-<listing_id>-<shop_id>-<randomId>.
      fqId: DataTypes.STRING,
      // A short id that can be exposed externally and should be used by buyers and merchants to refer to an order.
      shortId: DataTypes.STRING,
      // Current status of the order.
      paymentStatus: DataTypes.ENUM(OrderPaymentStatuses),
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
      // Date at which the order was recorded, either on or off-chain.
      createdAt: DataTypes.DATE
    },
    {
      underscored: true,
      tableName: 'orders',
      timestamps: false
    }
  )

  return MigOrder
}
