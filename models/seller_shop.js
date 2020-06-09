module.exports = (sequelize, DataTypes) => {
  const SellerShop = sequelize.define(
    'SellerShop',
    {
      sellerId: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      shopId: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      role: DataTypes.STRING
    },
    {
      underscored: true,
      tableName: 'seller_shop'
    }
  )

  SellerShop.associate = function (models) {
    SellerShop.belongsTo(models.Shop, {
      as: 'shop',
      foreignKey: { name: 'shopId' }
    })
    SellerShop.belongsTo(models.Seller, {
      as: 'seller',
      foreignKey: { name: 'sellerId' }
    })
  }

  return SellerShop
}
