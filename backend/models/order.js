const get = require('lodash/get')

module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const Order = sequelize.define(
    'Order',
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
      createdAt: DataTypes.DATE
    },
    {
      underscored: true,
      timestamps: false,
      tableName: 'orders',
      hooks: {
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
