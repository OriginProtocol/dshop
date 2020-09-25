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

const OrderPaymentStatuses = new Enum('Paid', 'Refunded', 'Pending', 'Rejected')

const OrderOfferStatuses = new Enum(
  'OfferCreated',
  'OfferAccepted',
  'OfferFinalized',
  'OfferWithdrawn',
  'OfferDisputed',
  'OfferData'
)

const TransactionStatuses = new Enum('Pending', 'Confirmed', 'Failed')

const TransactionTypes = new Enum('OfferCreated', 'Payment')

const ShopDeploymentStatuses = new Enum('Pending', 'Success', 'Failure')

const EtlJobStatuses = new Enum('Running', 'Success', 'Failure')

const OrderPaymentTypes = new Enum(
  'CreditCard',
  'PayPal',
  'Offline',
  'CryptoCurrency',
  'Uphold'
)

module.exports = {
  OrderPaymentStatuses,
  OrderOfferStatuses,
  TransactionStatuses,
  TransactionTypes,
  ShopDeploymentStatuses,
  EtlJobStatuses,
  OrderPaymentTypes
}
