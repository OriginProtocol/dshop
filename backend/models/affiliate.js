module.exports = (sequelize, DataTypes) => {
  const Affiliate = sequelize.define(
    'Affiliate',
    {
      account: DataTypes.STRING, // Checksummed ETH address of the affiliate.
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING
    },
    {
      underscored: true,
      tableName: 'affiliates'
    }
  )
  return Affiliate
}
