module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define(
    'Shop',
    {
      // 1=Mainnet, 4=Rinkeby, 999=local, etc...
      networkId: DataTypes.INTEGER,
      // Fully qualified listing Id (ex: 1-001-1212).
      // Either created by the merchant specifically for the shop or inherited from the network level (default).
      listingId: DataTypes.STRING,
      // Address of the merchant's wallet. Used for ex. to receive crypto payments.
      walletAddress: DataTypes.STRING,
      sellerId: DataTypes.INTEGER,
      hostname: DataTypes.STRING,
      name: DataTypes.STRING,
      authToken: DataTypes.STRING,
      password: DataTypes.STRING,
      config: DataTypes.TEXT,
      firstBlock: DataTypes.INTEGER,
      lastBlock: DataTypes.INTEGER,
      hasChanges: DataTypes.BOOLEAN
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
