module.exports = (sequelize, DataTypes) => {
  const Discount = sequelize.define(
    'Discount',
    {
      // Not populated in production.
      networkId: {
        type: DataTypes.INTEGER
      },
      shopId: {
        type: DataTypes.INTEGER
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive')
      },
      code: {
        type: DataTypes.STRING
      },
      discountType: {
        type: DataTypes.ENUM('fixed', 'percentage')
      },
      // If discountType is 'fixed', value is in dollar (not cents). Ex: 30 -> $30
      // If discountType is 'percentage', value is a plain percentage. Ex: 10 -> 10% off
      value: {
        type: DataTypes.INTEGER
      },
      maxUses: {
        type: DataTypes.INTEGER
      },
      onePerCustomer: {
        type: DataTypes.BOOLEAN
      },
      startTime: {
        type: DataTypes.DATE
      },
      endTime: {
        type: DataTypes.DATE
      },
      // Counter incremented every time the discount is used.
      uses: {
        type: DataTypes.INTEGER
      }
    },
    {
      underscored: true,
      tableName: 'discounts'
    }
  )

  Discount.associate = function (models) {
    Discount.belongsTo(models.Shop, { as: 'shops', foreignKey: 'shopId' })
  }

  return Discount
}
