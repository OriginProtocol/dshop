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
      // Foreign key to Seller.id
      sellerId: DataTypes.INTEGER,
      // Shop's URL hostname.
      hostname: DataTypes.STRING,
      name: DataTypes.STRING,
      // Unique id. Passed by the admin front-end to the back-end to indicate
      // which shop the admin actions should be applied to.
      // Also used as the unique directory name (aka "dataDir") to store the shop's data on-disk.
      authToken: DataTypes.STRING,
      // Optional. Set if the shop's access is password protected.
      password: DataTypes.STRING,
      // Encrypted JSON blob containing the shop's configuration parameters.
      config: DataTypes.TEXT,
      // Optional. Only used whe use of the marketplace is enabled (see Networks.useMarketplase).
      firstBlock: DataTypes.INTEGER,
      lastBlock: DataTypes.INTEGER,
      // True if the shop has changes that requires to get published.
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
    Shop.hasMany(models.ShopDomain, {
      as: 'shop_domains',
      onDelete: 'cascade'
    })
  }

  return Shop
}
