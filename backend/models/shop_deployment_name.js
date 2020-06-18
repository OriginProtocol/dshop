module.exports = (sequelize, DataTypes) => {
  const ShopDeploymentName = sequelize.define(
    'ShopDeploymentName',
    {
      ipfsHash: DataTypes.STRING,
      hostname: DataTypes.STRING
    },
    {
      underscored: true,
      tableName: 'shop_deployment_names'
    }
  )

  ShopDeploymentName.associate = function (models) {
    ShopDeploymentName.belongsTo(models.ShopDeployment, {
      as: 'shopDeployments',
      foreignKey: 'ipfsHash',
      targetKey: 'ipfsHash'
    })
  }

  return ShopDeploymentName
}
