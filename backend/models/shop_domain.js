const { ShopDomainStatuses } = require('../enums')

module.exports = (sequelize, DataTypes) => {
  const ShopDomain = sequelize.define(
    'ShopDomain',
    {
      shopId: DataTypes.INTEGER,
      status: DataTypes.ENUM(ShopDomainStatuses),
      domain: DataTypes.STRING,
      ipfsPinner: DataTypes.STRING, // URL of the IPFS pinner service used for the deployment.
      ipfsGateway: DataTypes.STRING, // URL of the gateway associated with the pinner used for deployment.
      ipfsHash: DataTypes.STRING, // IPFS hash of the deployment.
      error: DataTypes.STRING // Optional. Only populated when status is 'Failure'.
    },
    {
      underscored: true,
      tableName: 'shop_domains'
    }
  )

  ShopDomain.associate = function (models) {
    ShopDomain.belongsTo(models.Shop, {
      as: 'shopDomains',
      foreignKey: 'shopId'
    })
  }

  return ShopDomain
}
