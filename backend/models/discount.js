const { DiscountTypeEnums } = require('../utils/enums')

module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

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
        type: DataTypes.ENUM(DiscountTypeEnums)
      },
      // If discountType is 'fixed', value is in dollar (not cents). Ex: 30 -> $30
      // If discountType is 'percentage' or 'payment', value is a plain percentage. Ex: 10 -> 10% off
      value: {
        type: DataTypes.INTEGER
      },
      // Max number of times the discount can be used.
      // undefined or lower or equal to zero means unlimited.
      maxUses: {
        type: DataTypes.INTEGER
      },
      onePerCustomer: {
        type: DataTypes.BOOLEAN
      },
      excludeShipping: {
        type: DataTypes.BOOLEAN
      },
      startTime: {
        type: DataTypes.DATE
      },
      endTime: {
        type: DataTypes.DATE
      },
      // Counter to track the number of times the discount was used.
      uses: {
        type: DataTypes.INTEGER
      },
      data: {
        type: isPostgres ? DataTypes.JSONB : DataTypes.JSON
      },
      // The minimum cart value (subTotal) needed to avail the discount in dollar
      minCartValue: {
        type: DataTypes.INTEGER
      },
      // The maximum discount amount in dollar (only for `percentage` discount types).
      maxDiscountValue: {
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
