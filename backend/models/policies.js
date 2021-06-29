module.exports = (sequelize, DataTypes) => {
  const Policies = sequelize.define(
    'Policies',
    {
      shopId: DataTypes.INTEGER,
      allPolicies: DataTypes.STRING
    },
    {
      underscored: true,
      tableName: 'policies'
    }
  )

  Policies.associate = function (models) {
    Policies.belongsTo(models.Shop, { as: 'policies', foreignKey: 'shopId' })
  }

  return Policies
}
