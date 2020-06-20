require('dotenv').config()

const ReconnectingWebSocket = require('reconnecting-websocket')
const WebSocket = require('ws')

const Web3 = require('web3')
const get = require('lodash/get')

const { Network } = require('./models')
const { handleLog } = require('./utils/handleLog')
const { getLogger } = require('./utils/logger')

const log = getLogger('listener')

const web3 = new Web3()

let ws

const SubscribeToNewHeads = JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'eth_subscribe',
  params: ['newHeads']
})

/**
 * Prepares a request to subscribe to all events emitted by the marketplace contract.
 * @param {string} address: Marketplace contract's address.
 * @returns {string} The request to send to the provider.
 */
const SubscribeToLogs = ({ address }) => {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_subscribe',
    params: ['logs', { address }]
  })
}

/**
 * Prepares a request to fetch past events emitted by the marketplace contract.
 * @param {string} address: Marketplace contract's address.
 * @param {Integer} fromBlock: Block range start.
 * @param {Integer} toBlock: Block range end.
 * @returns {string} The request to send to the provider.
 */
const GetPastLogs = ({ address, fromBlock, toBlock }) => {
  const rpc = {
    jsonrpc: '2.0',
    id: 3,
    method: 'eth_getLogs',
    params: [
      {
        address,
        fromBlock: web3.utils.numberToHex(fromBlock),
        toBlock: web3.utils.numberToHex(toBlock)
      }
    ]
  }
  return JSON.stringify(rpc)
}

/**
 * Listener main.
 *
 * @param {Network} network: Network db model.
 * @returns {Promise<void>}
 */
async function connectWS({ network }) {
  let lastBlock, pingTimeout

  // Get the config from the network.
  const { networkId, providerWs } = network
  const address = network.marketplaceContract
  const contractVersion = network.marketplaceVersion
  lastBlock = network.lastBlock
  log.info(`Connecting to ${providerWs} (netId ${networkId})`)
  log.info(
    `Watching events on contract version ${contractVersion} at ${address}`
  )
  log.info(`Last recorded block: ${lastBlock}`)

  // Connect a web socket to the provider.
  ws = new ReconnectingWebSocket(providerWs, [], { WebSocket })

  function heartbeat() {
    clearTimeout(pingTimeout)
    pingTimeout = setTimeout(() => {
      log.warn('WS Ping timeout! Reconnecting...')
      ws.reconnect()
    }, 30000 + 5000)
  }

  ws.addEventListener('error', (err) => {
    log.error('WS error:', err.message)
  })
  ws.addEventListener('close', function clear() {
    log.warn('WS closed.')
  })
  ws.addEventListener('open', function open() {
    log.debug('WS open.')
    heartbeat()
    ws._ws.on('ping', () => {
      log.debug('WS ping.')
      heartbeat()
    })
    ws.send(SubscribeToLogs({ address }))
    ws.send(SubscribeToNewHeads)
  })

  const handled = {}
  let heads, logs
  ws.addEventListener('message', async function incoming(raw) {
    raw = raw.data

    const hash = web3.utils.sha3(raw)
    if (handled[hash]) {
      log.warn('Ignoring repeated ws message')
      return
    }
    handled[hash] = true

    const data = JSON.parse(raw)
    if (data.id === 1) {
      // Store subscription ID for Logs
      logs = data.result
    } else if (data.id === 2) {
      heads = data.result
    } else if (data.id === 3) {
      log.info(`Got ${data.result.length} unhandled logs`)
      for (const result of data.result) {
        await handleLog({
          ...result,
          web3,
          address,
          networkId,
          contractVersion
        })
      }
    } else if (get(data, 'params.subscription') === logs) {
      await handleLog({
        ...data.params.result,
        web3,
        address,
        networkId,
        contractVersion
      })
    } else if (get(data, 'params.subscription') === heads) {
      const number = handleNewHead(data.params.result, networkId)
      const blockDiff = number - lastBlock
      if (blockDiff > 500) {
        log.warn('Too many new blocks. Skip past log fetch.')
      } else if (blockDiff > 1) {
        log.info(
          `Fetching ${blockDiff} past logs. Range ${lastBlock}-${number}...`
        )
        ws.send(GetPastLogs({ address, fromBlock: lastBlock, toBlock: number }))
      }
      lastBlock = number
    } else {
      log.warn('Unknown message')
    }
  })
}

const handleNewHead = (head, networkId) => {
  const number = web3.utils.hexToNumber(head.number)
  const timestamp = web3.utils.hexToNumber(head.timestamp)

  Network.upsert({ networkId, lastBlock: number })
  log.debug(`New block ${number} timestamp: ${timestamp}`)

  return number
}

async function start() {
  const network = await Network.findOne({ where: { active: true } })
  if (!network) {
    log.warn('Listener disabled: no active network found.')
    return
  }

  log.info(`Starting listener on network ${network.networkId}.`)
  web3.setProvider(network.provider)

  connectWS({ network })
}

module.exports = start
