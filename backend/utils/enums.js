const PrintfulWebhookEvents = {
  PackageShipped: 'package_shipped',
  PackageReturned: 'package_returned',
  OrderFailed: 'order_failed',
  OrderCanceled: 'order_canceled',
  ProductSynced: 'product_synced',
  ProductUpdated: 'product_updated',
  OrderPutHold: 'order_put_hold',
  OrderRemoveHold: 'order_remove_hold'
}

const ExternalServices = {
  Printful: 'printful'
}

module.exports = {
  PrintfulWebhookEvents,
  ExternalServices
}
