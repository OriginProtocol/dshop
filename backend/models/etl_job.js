const { EtlJobStatuses } = require('../enums')

module.exports = (sequelize, DataTypes) => {
  const EtlJob = sequelize.define(
    'EtlJob',
    {
      status: DataTypes.ENUM(EtlJobStatuses),
      error: DataTypes.STRING // Optional. Only populated when status is 'Failure'.
    },
    {
      underscored: true,
      tableName: 'etl_shops'
    }
  )

  return EtlJob
}
