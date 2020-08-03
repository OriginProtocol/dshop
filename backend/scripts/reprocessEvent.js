// A utility script for reprocessing a blockchain event.
// Can be used in case the listener errored out while processing an event.
// The script expects the event to have been recorded in the events DB table.
//
// Note: The easiest is to run the script from local after having setup
// a SQL proxy to prod and the ENCRYPTION_KEY env var.
//
// Examples:
//  - Dry-run reprocessing of a log:
//  node reprocessEvent.js --networkId=1 --listingId=233 --offerId=559
//  - Reprocessing for real (writes to the DB, emails the buyer/seller, etc...).
//  node reprocessEvent.js --networkId=1 --listingId=233 --offerId=559 --doIt=true
//

const { Event, Shop, Order } = require('../models')
const { processDShopEvent } = require('../utils/handleLog')
const { getLogger } = require('../utils/logger')
const program = require('commander')

const log = getLogger('cli')

program
  .requiredOption('-n, --networkId <id>', 'Network id: [1,4,999]')
  .requiredOption('-l, --listingId <id>', 'Listing id')
  .requiredOption('-o, --offerId <id>', 'Offer id')
  .option(
    '-d, --doIt <boolean>',
    'Non dry-run mode. Persists the data in the DB.'
  )

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

async function reprocess(config) {
  const networkId = program.networkId
  const listingId = program.listingId
  const offerId = program.offerId

  // Load the event from the DB.
  const event = await Event.findOne({
    where: { networkId, listingId, offerId }
  })
  if (!event) {
    throw new Error(
      `No event found for networkId=${networkId} listingId=${listingId} offerId=${offerId}`
    )
  }
  log.info('Found Event:', event.get({ plain: true }))

  // Load the associated shop.
  const shop = await Shop.findOne({ where: { id: event.shopId } })
  if (!shop) {
    throw new Error(`No shop with id ${event.shopId} found.`)
  }
  log.info(`Event associated with shop ${shop.name} (${shop.id})`)

  // Sanity check that if there is already an order, its status is error.
  const orderId = `${networkId}-001-${listingId}-${offerId}`
  const order = await Order.findOne({ where: { orderId } })
  if (order) {
    if (order.statusStr !== 'error') {
      throw new Error(
        `Found existing order ${orderId} with non-error status ${order.statusStr}`
      )
    }
    log.info(`Found existing order ${orderId}:`, order.get({ plain: true }))
  } else {
    log.info('No existing order found with id', orderId)
  }

  if (config.doIt) {
    log.info('Calling processDShopEvent to reprocess the event.')
    const order = await processDShopEvent({ event, shop })
    log.info('Created order:', order.get({ plain: true }))
    log.info('Sleeping 5sec to wait for async calls to complete...')
    await new Promise((resolve) => setTimeout(resolve, 5000))
  } else {
    log.info(`Would call processDShopEvent`)
  }
}

//
// MAIN
//
reprocess(program)
  .then(() => {
    log.info('Finished')
    process.exit()
  })
  .catch((err) => {
    log.error('Failure: ', err)
    log.error('Exiting')
    process.exit(-1)
  })
