// A utility script for migrating orders data as part of the
// rollout of the off-chain order recording feature.

const get = require('lodash/get')

const { MigOrder, OldOrder, Network, Shop } = require('../../models')
const { createOrderId } = require('../../logic/order')
const { OrderPaymentStatuses, OrderOfferStatuses } = require('../../enums')

const { getLogger } = require('../../utils/logger')
const log = getLogger('cli')

const program = require('commander')

program
  .requiredOption('-n, --networkId <id>', 'Network id: [1,4,999]')
  .option('-d, --doIt <boolean>', 'Write the data to DB/disk.')

if (!process.argv.slice(1).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

function getPaymentStatus(offerStatus) {
  let paymentStatus
  switch (offerStatus) {
    case OrderOfferStatuses.OfferCreated:
    case OrderOfferStatuses.OfferAccepted:
    case OrderOfferStatuses.OfferFinalized:
    case OrderOfferStatuses.OfferData:
      paymentStatus = OrderPaymentStatuses.Paid
      break
    case OrderOfferStatuses.OfferDisputed:
    case OrderOfferStatuses.OfferWithdrawn:
      paymentStatus = OrderPaymentStatuses.Refunded
      break
    default:
      throw new Error(`Unexpected offer status ${offerStatus}`)
  }
  return paymentStatus
}

async function main() {
  const network = await Network.findOne({
    where: { networkId: program.networkId }
  })
  if (!network) {
    throw new Error(`No network with id ${program.networkId}`)
  }

  const oldOrders = await OldOrder.findAll()
  for (const oldOrder of oldOrders) {
    if (!oldOrder.statusStr || oldOrder.statusStr === 'error') {
      // A few order rows created in the system early on were empty and had a status of 'errpr'.
      // Do not migrate those.
      log.info(`Skipping order ${oldOrder.orderId} with status error or empty`)
      continue
    }
    log.info(`Processing ${oldOrder.orderId}`)

    const shop = await Shop.findOne({ where: { id: oldOrder.shopId } })
    if (!shop) {
      throw new Error(`Failed loading shop ${oldOrder.shopId}`)
    }

    const { fqId } = createOrderId(network, shop)
    const paymentStatus = getPaymentStatus(oldOrder.statusStr)
    const data = {
      shopId: oldOrder.shopId,
      networkId: oldOrder.networkId,
      fqId,
      // Important: we set the shortId to the old style orderId which was using the fully qualified offerId.
      // The reason is for keeping backward compatibility with external systems such as Printful
      // where those legacy orders have been recorded using the old id scheme.
      // The drawback is that for those legacy orders the fqId and shortId will be inconsistent
      // but this trade-off simplifies the migration quite a bit and seems worth it.
      shortId: oldOrder.orderId,
      paymentStatus,
      paymentCode: oldOrder.paymentCode,
      ipfsHash: oldOrder.ipfsHash,
      encryptedIpfsHash: oldOrder.encryptedIpfsHash,
      offerId: oldOrder.orderId,
      offerStatus: oldOrder.statusStr,
      createdBlock: oldOrder.createdBlock,
      updatedBlock: oldOrder.updatedBlock,
      currency: get(oldOrder, 'data.currency', 'USD'),
      total: get(oldOrder, 'data.total', 0),
      data: oldOrder.data,
      referrer: oldOrder.referrer,
      commissionPending: oldOrder.commissionPending,
      commissionPaid: oldOrder.commissionPaid,
      createdAt: oldOrder.createdAt
    }
    if (program.doIt) {
      // Note: we use the MigOrder model which allows us to set the createdAt timestamp
      // as opposed to sequelize setting it automatically to the current time.
      const order = await MigOrder.create(data)
      log.info(`Created order ${order.id}`)
    } else {
      log.info(`Would migrate old order ${oldOrder.orderId}`)
    }
  }
}

//
// MAIN
//
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
