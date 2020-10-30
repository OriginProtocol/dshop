module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const Product = sequelize.define(
    'Product',
    {
      productId: DataTypes.STRING, // Product Id from products.json
      shopId: DataTypes.INTEGER, // The shop the action was applied to.
      stockLeft: DataTypes.INTEGER, // Cumulative stock left
      variantsStock: isPostgres ? DataTypes.JSONB : DataTypes.JSON, // Available stock of each variant
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    },
    {
      underscored: true,
      tableName: 'products'
    }
  )

  return Product
}
