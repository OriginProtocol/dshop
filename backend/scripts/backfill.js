/**
 * A tool for re-reprocessing a shop's blockchain events.
 *
 * It fetches events from the marketplace contract that are related to
 * the listings associated with the shop.
 *  - All events are persisted in the events table in the DB
 *  - In addition, processing is done depending on the event type. Currently
 *  only "Offer" events are handled and other event types are skipped
 *  but this may change in the future.
 *
 * Depending on the value of the field "lastBlock" on the row associated with
 * the shop in the table "shops" in the DB, the tool does either a full or partial backfill:
 *  - full backfill if "lastBlock" is empty.
 *  - partial backfill starting at block number "startBlock" + 1 if "startBlock" is populated.
 *
 * Note: when processing an order, the tool does NOT send any email or discord
 * messages in order to avoid sending duplicates in case those had already been sent.
 *
 * Setup: The tool can either be run from a local host with a proxy to the
 * production database, or directly from a production host. It requires
 * the following environment variables to be set:
 *  - DATABASE_URL
 *  - ENCRYPTION_KEY
 *
 * Usage example:
 *  - Dry run mode (does not write any data to the DB):
 *    #> node backfill.js --listingId 1-001-81
 *
 *  - Run for real (writes data to the DB):
 *    #> node backfill.js --listingId 1-001-81 --doIt
 */

require('dotenv').config()
const program = require('commander')

const Web3 = require('web3')
const web3 = new Web3()
const range = require('lodash/range')
const flattenDeep = require('lodash/flattenDeep')
const Bottleneck = require('bottleneck')
const fetch = require('node-fetch')
const get = require('lodash/get')

const { sequelize, Shop, Network, Event } = require('../models')
const { CONTRACTS } = require('../utils/const')
const { storeEvents, getEventObj } = require('../utils/events')

const { processDShopEvent } = require('../utils/handleLog')

const limiter = new Bottleneck({ maxConcurrent: 10 })

// Note: Alchemy max allowed block size is 1k
const batchSize = 1000

async function getLogs({ provider, listingId, address, fromBlock, toBlock }) {
  const listingTopic = web3.utils.padLeft(web3.utils.numberToHex(listingId), 64)
  const rpc = {
    jsonrpc: '2.0',
    id: 3,
    method: 'eth_getLogs',
    params: [
      {
        address,
        topics: [null, null, listingTopic],
        fromBlock: web3.utils.numberToHex(fromBlock),
        toBlock: web3.utils.numberToHex(toBlock)
      }
    ]
  }

  console.log(`Fetching logs ${fromBlock}-${toBlock}`)
  const body = JSON.stringify(rpc)
  const res = await fetch(provider, { method: 'POST', body })
  const resJson = await res.json()
  return resJson.result
}

function extractListing(listingIdFull) {
  if (!String(listingIdFull).match(/^[0-9]+-[0-9]+-[0-9]+$/)) {
    throw new Error('Invalid Listing ID. Must be xxx-xxx-xxx eg 1-001-123')
  }
  console.log(`Fetching events for listing ${listingIdFull}`)

  const [networkId, contractId, listingId] = listingIdFull.split('-')
  return { networkId, contractId, listingId }
}

/**
 * Loads the Shop and Network from the DB.
 * @param {string} listingIdFull
 * @returns {Promise<{shop: Shop, network: Network}>}
 */
async function loadShopAndNetwork(listingIdFull) {
  const [networkId] = listingIdFull.split('-')
  const network = await Network.findOne({ where: { networkId } })
  if (!network) {
    throw new Error(`No network with ID ${networkId}`)
  }
  if (!network.provider) {
    throw new Error(`Network ${networkId} has no provider set`)
  }
  console.log(`Using provider ${network.provider}`)

  const shop = await Shop.findOne({ where: { listingId: listingIdFull } })
  if (!shop) {
    throw new Error(`No shop with listing ID ${listingIdFull}`)
  }
  console.log(`Found shop ${shop.id} with listing ${shop.listingId}`)

  return { network, shop }
}

/**
 * Fetches all events for a shop, from the time the listing was created until now.
 * @param {string} listingIdFull
 * @param {boolean} doIt: if true, events are persisted in the DB.
 * @returns {Promise<void>}
 */
async function fetchEvents(listingIdFull, doIt) {
  const { networkId, contractId, listingId } = extractListing(listingIdFull)
  const { network, shop } = await loadShopAndNetwork(listingIdFull)

  // Query recorded events in the DB to determine the range of blocks
  // that have already been processed.
  const { minBlock, maxBlock } = await Event.findOne({
    raw: true,
    where: { shopId: shop.id },
    attributes: [
      [sequelize.fn('MIN', sequelize.col('block_number')), 'minBlock'],
      [sequelize.fn('MAX', sequelize.col('block_number')), 'maxBlock']
    ]
  })
  if (minBlock) {
    console.log(`Earliest event at block ${minBlock}, latest ${maxBlock}`)
  }

  const listingCreatedEvent = await Event.findOne({
    raw: true,
    where: { shopId: shop.id, eventName: 'ListingCreated' },
    attributes: ['block_number']
  })
  if (listingCreatedEvent) {
    console.log(`ListingCreated at block ${listingCreatedEvent.block_number}`)
  } else {
    console.log('No ListingCreated event')
  }

  const contract = get(CONTRACTS, `${networkId}.marketplace.${contractId}`)
  if (!contract) {
    console.log('Could not find contract address')
    return
  }

  web3.setProvider(network.provider)

  let events = []

  const latestBlock = await web3.eth.getBlockNumber()
  console.log(`Latest block is ${latestBlock}`)

  // Fetch all events from last block indexed + 1 until latest block.
  if (listingCreatedEvent) {
    const toBlock = latestBlock
    const fromBlock = maxBlock + 1

    // Prepare concurrent requests to fetch logs.
    const requests = range(fromBlock, toBlock + 1, batchSize).map((start) =>
      limiter.schedule((args) => getLogs(args), {
        fromBlock: start,
        toBlock: Math.min(start + batchSize - 1, toBlock),
        listingId,
        address: contract,
        provider: network.provider
      })
    )

    const numBlocks = toBlock - fromBlock + 1
    console.log(`Querying ${numBlocks} blocks in ${requests.length} requests`)

    if (!numBlocks) {
      console.log('No blocks to query.')
      return
    }

    // Issues the requests to the blockchain.
    const eventsChunks = await Promise.all(requests)
    events = flattenDeep(eventsChunks)

    // Store the events in the DB.
    if (doIt) {
      console.log(`Storing ${events.length} events in the DB`)
      await storeEvents({ web3, events, shopId: shop.id, networkId })
    } else {
      console.log(`Would store ${events.length} events in the DB`)
    }
  } else {
    // Fetch all events from current block going back until we find
    // the initial ListingCreated event.
    console.log(`Fetching all events ending block ${latestBlock}`)
    let listingCreatedEvent
    let fromBlock = minBlock || latestBlock
    do {
      const toBlock = fromBlock - 1
      fromBlock -= batchSize
      console.log(`Querying blocks ${fromBlock}-${toBlock}`)
      const batchEvents = await getLogs({
        fromBlock,
        toBlock,
        listingId,
        address: contract,
        provider: network.provider
      })

      console.log(`Found ${batchEvents.length} events`)

      if (doIt) {
        console.log(`Storing ${batchEvents.length} in the DB`)
        await storeEvents({
          web3,
          events: batchEvents,
          shopId: shop.id,
          networkId
        })
      } else {
        console.log('Would store ${events.length} in the DB')
      }

      listingCreatedEvent = batchEvents
        .map((e) => getEventObj(e))
        .find((o) => o.eventName === 'ListingCreated')
    } while (!listingCreatedEvent)

    shop.firstBlock = listingCreatedEvent.blockNumber
    shop.lastBlock = latestBlock

    if (doIt) {
      await shop.save()
      console.log(
        `Updated shop in the DB: firstBlock=${shop.firstBlock} lastBlock=${shop.lastBlock}`
      )
    } else {
      console.log(
        `Would update shop in the DB: firstBlock=${shop.firstBlock} lastBlock=${shop.lastBlock}`
      )
    }
  }
}

/**
 * Update the orders data in the DB by re-processing all the events for a shop.
 *
 * @param {string} listingIdFull
 * @param {boolean} doIt: if true, orders are persisted in the DB.
 * @returns {Promise<void>}
 */
async function processEvents(listingIdFull, doIt) {
  const { shop } = await loadShopAndNetwork(listingIdFull)

  // Load all the events from the DB.
  const events = await Event.findAll({
    where: { shopId: shop.id },
    order: [['block_number', 'ASC']]
  })
  console.log(`Loaded ${events.length} from the DB for re-processing.`)

  // Process each event in order, older first.
  for (const event of events) {
    if (doIt) {
      // Note: we skip sending email and calling discord since we are
      // re-processing the events and don't want to send duplicate messages.
      try {
        await processDShopEvent({
          event,
          shop,
          skipEmail: true,
          skipDiscord: true
        })
      } catch (err) {
        console.log(`Skipping processing event with id ${event.id}.`, err)
      }
    } else {
      console.log(`Would re-process event ${event.eventName}`)
    }
  }
}

async function run(listingId, doIt) {
  await fetchEvents(listingId, doIt)
  await processEvents(listingId, doIt)
}

// Main
program
  .requiredOption(
    '-l, --listingId <listingId>',
    'Fully qualified listing ID. For ex: 1-001-123'
  )
  .option('-d, --doIt', 'Non dry-run mode. Persists the data in the DB.')
program.parse(process.argv)

run(program.listingId, program.doIt)
  .then(() => {
    console.log('Finished')
    process.exit()
  })
  .catch((err) => {
    console.log('Failure: ', err)
    console.log('Exiting')
    process.exit(-1)
  })
