module.exports = (sequelize, DataTypes) => {
  const Policies = sequelize.define(
    'Policies',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true
      },
      shopId: { type: DataTypes.INTEGER, unique: true },
      allPolicies: { type: DataTypes.JSON }
    },
    {
      underscored: true,
      tableName: 'policies'
    }
  )

  // Reference: https://sequelize.org/master/manual/assocs.html
  // In the Policies model, use a custom name for the foreign key. Additionally, associate the model with the 'shop_id' field of the shop
  // instead of its primary key.
  Policies.associate = function (models) {
    Policies.belongsTo(models.Shop, {
      foreignKey: 'shopId'
    })
  }

  return Policies
}
