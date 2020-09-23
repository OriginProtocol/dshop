// Table used during the off-chain migration. Contains legacy orders.
// Will get deleted once the migration is done.

module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const OldOrder = sequelize.define(
    'OldOrder',
    {
      shopId: DataTypes.INTEGER,
      // Ethereum network id. 1=Mainnet, 4=Rinkeby, 999=local
      networkId: DataTypes.INTEGER,
      // Unique order id. Format: <network>-<contract_version>-<listing_id>-<offer_id>. Ex: '1-001-233-19'
      orderId: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true
      },
      // IPFS hash for the offer data.
      ipfsHash: DataTypes.STRING,
      // IPFS hash of the encrypted offer data.
      encryptedIpfsHash: DataTypes.STRING,
      // Block number at which the offer was created.
      createdBlock: DataTypes.INTEGER,
      // Block number of the most recent offer update.
      updatedBlock: DataTypes.INTEGER,
      // Not used at the moment.
      status: DataTypes.INTEGER,
      // 'OfferCreated', 'OfferFinalized', 'OfferWithdrawn' or 'error'
      statusStr: DataTypes.STRING,
      // Not populated at the moment.
      currency: DataTypes.STRING,
      // Not populated at the moment.
      value: DataTypes.STRING,
      // Not populated at the moment.
      commission: DataTypes.STRING,
      // Not populated at the moment.
      buyer: DataTypes.STRING,
      // Not populated at the moment.
      affiliate: DataTypes.STRING,
      // Not populated at the moment.
      arbitrator: DataTypes.STRING,
      // Not populated at the moment.
      finalizes: DataTypes.STRING,
      // Not populated at the moment.
      notes: DataTypes.TEXT,
      // Details about the order: Item bought, Buyer address, phone and email, etc...
      // Note: Postgres supports JSONB while sqlite only supports JSON.
      data: isPostgres ? DataTypes.JSONB : DataTypes.JSON,
      // Checksummed ETH address of the referrer.
      referrer: DataTypes.TEXT,
      // Amount of OGN commission owed to the referrer.
      commissionPending: DataTypes.INTEGER,
      // Amount of OGN commission paid to the referrer.
      commissionPaid: DataTypes.INTEGER,
      // Date at which the offer was recorded on-chain.
      createdAt: DataTypes.DATE,
      // Optional. Links an external payment (ex: credit card) to an order. See external_payments.payment_code
      paymentCode: DataTypes.STRING
    },
    {
      underscored: true,
      timestamps: false,
      tableName: 'old_orders'
    }
  )

  return OldOrder
}
