module.exports = (sequelize, DataTypes) => {
  const Affiliate = sequelize.define(
    'Affiliate',
    {
      account: DataTypes.STRING,
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