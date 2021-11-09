const { ShopDeploymentStatuses } = require('../utils/enums')

module.exports = (sequelize, DataTypes) => {
  const ShopDeployment = sequelize.define(
    'ShopDeployment',
    {
      shopId: DataTypes.INTEGER,
      status: DataTypes.ENUM(ShopDeploymentStatuses),
      ipfsPinner: DataTypes.STRING, // URL of the IPFS pinner service used for the deployment.
      ipfsGateway: DataTypes.STRING, // URL of the gateway associated with the pinner used for deployment.
      ipfsHash: DataTypes.STRING, // IPFS hash of the deployment.
      bucketUrls: DataTypes.STRING, // Native URLs to buckets, comma separated
      bucketHttpUrls: DataTypes.STRING, // HTTP URLs to buckets, comma separated
      error: DataTypes.STRING, // Optional. Only populated when status is 'Failure'.
      uuid: DataTypes.STRING // Optional. A UUID used for reference
    },
    {
      underscored: true,
      tableName: 'shop_deployments'
    }
  )

  ShopDeployment.associate = function (models) {
    ShopDeployment.belongsTo(models.Shop, {
      as: 'shopDeployments',
      foreignKey: 'shopId'
    })
    ShopDeployment.hasMany(models.ShopDomain, {
      as: 'domains',
      foreignKey: 'shopId',
      sourceKey: 'shopId'
    })
  }

  return ShopDeployment
}
