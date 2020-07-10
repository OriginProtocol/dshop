module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const ExternalEvent = sequelize.define(
    'ExternalEvent',
    {
      shopId: DataTypes.INTEGER,
      service: DataTypes.STRING,
      event_type: DataTypes.STRING,
      data: isPostgres ? DataTypes.JSONB : DataTypes.JSON
    },
    {
      underscored: true,
      tableName: 'external_events'
    }
  )

  ExternalEvent.associate = function (models) {
    ExternalEvent.belongsTo(models.Shop, {
      foreignKey: 'shopId'
    })
  }

  return ExternalEvent
}
