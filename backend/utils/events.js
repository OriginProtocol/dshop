const Web3 = require('web3')
const w3 = new Web3()

const { getIpfsHashFromBytes32 } = require('./_ipfs')

const { Event } = require('../models')
const { getLogger } = require('../utils/logger')

const abi = require('./_abi')

const log = getLogger('utils.events')
const Marketplace = new w3.eth.Contract(abi)

function getEventObj(event) {
  let decodedLog = {}
  const eventAbi = Marketplace._jsonInterface.find(
    (i) => i.signature === event.topics[0]
  )
  if (eventAbi) {
    decodedLog = w3.eth.abi.decodeLog(
      eventAbi.inputs,
      event.data,
      event.topics.slice(1)
    )
  }
  return {
    ...event,
    blockNumber: w3.utils.toDecimal(event.blockNumber),
    topic1: event.topics[0],
    topic2: event.topics[1],
    topic3: event.topics[2],
    topic4: event.topics[3],
    eventName: eventAbi.name,
    party: decodedLog.party,
    listingId: decodedLog.listingID,
    offerId: decodedLog.offerID,
    ipfsHash: decodedLog.ipfsHash
      ? getIpfsHashFromBytes32(decodedLog.ipfsHash)
      : ''
  }
}

async function upsertEvent({ web3, event, shopId, networkId }) {
  log.debug('Upsert event...')
  const eventObj = { ...getEventObj(event), shopId, networkId }

  // Make sure this event hasn't alredy been recorded in the DB.
  const { transactionHash } = event
  const exists = await Event.findOne({ where: { transactionHash } })
  if (exists) {
    log.debug('Event exists')
    return exists
  }

  // Fetch the block to get its timestamp.
  const block = await web3.eth.getBlock(eventObj.blockNumber)
  if (block) {
    eventObj.timestamp = block.timestamp
  } else {
    // Best effort.  This is likely only to happen with newer blocks
    eventObj.timestamp = Math.floor(+new Date() / 1000)
  }

  // Save the event in the DB.
  const record = await Event.create(eventObj)
  if (!record) {
    throw new Error('Could not save event')
  }
  return record
}

async function storeEvents({ web3, events, shopId, networkId }) {
  for (const event of events) {
    await upsertEvent({ web3, event, shopId, networkId })
  }
}

module.exports = {
  getEventObj,
  upsertEvent,
  storeEvents
}
