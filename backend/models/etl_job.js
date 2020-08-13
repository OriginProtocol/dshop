const { EtlJobStatuses } = require('../enums')

module.exports = (sequelize, DataTypes) => {
  const EtlJob = sequelize.define(
    'EtlJob',
    {
      status: DataTypes.ENUM(EtlJobStatuses)
    },
    {
      underscored: true,
      tableName: 'etl_jobs'
    }
  )

  return EtlJob
}
