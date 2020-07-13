const { PrintfulWebhookEvents, ExternalServices } = require('../utils/enums')

module.exports = (sequelize, DataTypes) => {
  const isPostgres = sequelize.options.dialect === 'postgres'

  const ExternalEvent = sequelize.define(
    'ExternalEvent',
    {
      shopId: DataTypes.INTEGER,
      service: DataTypes.ENUM(...Object.values(PrintfulWebhookEvents)),
      event_type: DataTypes.ENUM(...Object.values(ExternalServices)),
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
