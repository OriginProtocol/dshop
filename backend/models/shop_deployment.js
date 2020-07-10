module.exports = (sequelize, DataTypes) => {
  const ShopDeployment = sequelize.define(
    'ShopDeployment',
    {
      shopId: DataTypes.INTEGER,
      // Depreciated.  should be added to shop_deployment_names
      domain: DataTypes.STRING,
      ipfsPinner: DataTypes.STRING, // URL of the pinner used for the deployment.
      ipfsHash: DataTypes.STRING // Hash of the deployment.
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
