// A script to backfill the `Order.paymentType` column

const get = require('lodash/get')

const { Order } = require('../../models')
const { OrderPaymentTypes } = require('../../enums')

const { getLogger } = require('../../utils/logger')
const log = getLogger('cli')

const program = require('commander')

program.option('-d, --doIt <boolean>', 'Write the data to DB/disk.')

if (!process.argv.slice(1).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

const paymentMethodIdTypeMap = {
  crypto: OrderPaymentTypes.CryptoCurrency,
  paypal: OrderPaymentTypes.PayPal,
  uphold: OrderPaymentTypes.Uphold,
  stripe: OrderPaymentTypes.CreditCard,
  offline: OrderPaymentTypes.Offline
}

const main = async () => {
  const orders = await Order.findAll({
    where: {
      paymentType: null
    }
  })

  log.info(`Found ${orders.length} orders without payment type set`)

  for (const order of orders) {
    const paymentMethodId = get(order, 'data.paymentMethod.id')
    let paymentType = paymentMethodIdTypeMap[paymentMethodId]

    if (!paymentType) {
      // Offline payment methods have different IDs
      paymentType = OrderPaymentTypes.Offline
    }

    if (program.doIt) {
      await order.update({
        paymentType
      })
      log.info(
        `Updated payment type of #${order.id} (payment method: ${paymentMethodId}) to ${paymentType}`
      )
    } else {
      log.info(
        `Would have updated payment type of #${order.id} (payment method: ${paymentMethodId}) to ${paymentType}`
      )
    }
  }
}

main()
  .then(() => {
    log.info('Finished')
    process.exit()
  })
  .catch((err) => {
    log.error('Failure: ', err)
    log.error('Exiting')
    process.exit(-1)
  })
