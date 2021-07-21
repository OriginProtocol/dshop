module.exports = (sequelize, DataTypes) => {
  const Policies = sequelize.define(
    'Policies',
    {
      allPolicies: DataTypes.JSON
    },
    {
      underscored: true,
      tableName: 'policies'
    }
  )

  // Reference: https://sequelize.org/master/manual/assocs.html
  // In the Policies model, use a custom name for the foreign key. Additionally, associate the model with the 'auth_token' field of the shop
  // instead of its primary key.
  Policies.associate = function (models) {
    Policies.belongsTo(models.Shop, {
      targetKey: 'authToken',
      foreignKey: 'authToken'
    })
  }

  return Policies
}
