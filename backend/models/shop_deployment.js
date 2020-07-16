module.exports = (sequelize, DataTypes) => {
  const ShopDeployment = sequelize.define(
    'ShopDeployment',
    {
      shopId: DataTypes.INTEGER,
      // Depreciated.  should be added to shop_deployment_names
      domain: DataTypes.STRING,
      ipfsPinner: DataTypes.STRING, // URL of the IPFS pinner service used for the deployment.
      ipfsGateway: DataTypes.STRING, // URL of the gateway associated with the pinner used for deployment.
      ipfsHash: DataTypes.STRING // IPFS hash of the deployment.
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
    ShopDeployment.hasMany(models.ShopDeploymentName, {
      as: 'names',
      foreignKey: 'ipfsHash',
      sourceKey: 'ipfsHash',
      onDelete: 'cascade'
    })
  }

  return ShopDeployment
}
