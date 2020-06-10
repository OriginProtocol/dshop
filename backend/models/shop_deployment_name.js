module.exports = (sequelize, DataTypes) => {
  const ShopDeploymentNames = sequelize.define(
    'ShopDeploymentNames',
    {
      ipfsHash: DataTypes.STRING,
      hostname: DataTypes.STRING
    },
    {
      underscored: true,
      tableName: 'shop_deployment_names'
    }
  )

  ShopDeploymentNames.associate = function (models) {
    ShopDeploymentNames.belongsTo(models.ShopDeployment, {
      as: 'names',
      foreignKey: 'shopDeploymentId'
    })
  }

  return ShopDeploymentNames
}
