/**
 * IMPORTANT: If you add an entry to an enum below, do not forget to add
 *  a migration script to add the enum to the DB.
 */

class Enum extends Array {
  constructor(...args) {
    super(...args)

    for (const k of args) {
      this[k] = k
    }
  }
}

const OrderStatuses = new Enum('Paid', 'Canceled')

const TransactionStatuses = new Enum('Pending', 'Confirmed', 'Failed')

const TransactionTypes = new Enum('OfferCreated', 'Payment')

const ShopDeploymentStatuses = new Enum('Pending', 'Success', 'Failure')

const EtlJobStatuses = new Enum('Running', 'Success', 'Failure')

module.exports = {
  OrderStatuses,
  TransactionStatuses,
  TransactionTypes,
  ShopDeploymentStatuses,
  EtlJobStatuses
}
