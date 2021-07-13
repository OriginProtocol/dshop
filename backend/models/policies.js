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
  Policies.associate = function (models) {
    Policies.belongsTo(models.Shop, {
      as: 'shopAdmin',
      foreignKey: { authToken: DataTypes.STRING },
      allowNull: false
    })
    Policies.belongsTo(models.Shop, {
      as: 'shopCustomer',
      foreignKey: { id: DataTypes.INTEGER },
      allowNull: false
    })
  }

  return Policies
}
