const { TransactionTypes, TransactionStatuses } = require('../enums')

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    'Transaction',
    {
      networkId: DataTypes.INTEGER, // 1=Mainnet, 4=Rinkeby, 999=localhost, etc...
      shopId: DataTypes.INTEGER, // Id of the shop associated with the transaction.
      type: DataTypes.ENUM(TransactionTypes), // The type of transaction.
      status: DataTypes.ENUM(TransactionStatuses), // The status of the transaction.
      fromAddress: DataTypes.STRING, // The ETH address used for sending the transaction.
      toAddress: DataTypes.STRING, // The ETH address the transaction was sent to.
      hash: DataTypes.STRING, // The hash of the blockchain transaction.
      blockNumber: DataTypes.INTEGER, // The block the transaction was mined at.
      ipfsHash: DataTypes.STRING, // IPFS hash. Optional. Depends on the transaction type.
      listingId: DataTypes.STRING, // Fully qualified listing id. Optional. Depends on the transaction type.
      offerId: DataTypes.STRING, // Fully qualified offer id. Optional. Depends on the transaction type.
      jobId: DataTypes.STRING, // Optional. ID of the job in the queue that created the transaction.
      customId: DataTypes.STRING // Optional. Depends on the transaction type. For OfferCreated, stores the paymentCode (from external_payments table)..
    },
    {
      underscored: true,
      tableName: 'transactions'
    }
  )

  Transaction.associate = function (models) {
    Transaction.belongsTo(models.Shop, { as: 'shops', foreignKey: 'shopId' })
  }

  return Transaction
}
