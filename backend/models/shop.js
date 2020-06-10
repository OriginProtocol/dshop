module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define(
    'Shop',
    {
      networkId: DataTypes.INTEGER,
      listingId: DataTypes.STRING, // e.g. 1-001-1212
      sellerId: DataTypes.INTEGER,
      hostname: DataTypes.STRING,
      name: DataTypes.STRING,
      authToken: DataTypes.STRING,
      password: DataTypes.STRING,
      config: DataTypes.TEXT,
      firstBlock: DataTypes.INTEGER,
      lastBlock: DataTypes.INTEGER
    },
    {
      underscored: true,
      tableName: 'shops'
    }
  )

  Shop.associate = function (models) {
    Shop.belongsToMany(models.Seller, {
      through: models.SellerShop,
      onDelete: 'cascade'
    })
    Shop.hasMany(models.Order, {
      as: 'orders',
      targetKey: 'shopId',
      onDelete: 'cascade',
      hooks: true
    })
    Shop.hasMany(models.Transaction, {
      as: 'transactions',
      onDelete: 'cascade'
    })
    Shop.hasMany(models.Discount, { as: 'discounts', onDelete: 'cascade' })
    Shop.hasMany(models.ShopDeployment, {
      as: 'shop_deployments',
      onDelete: 'cascade'
    })
  }

  return Shop
}
