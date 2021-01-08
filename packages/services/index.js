const { spawn } = require('child_process')
const Ganache = require('ganache-core')
const IPFS = require('ipfs')
const HttpIPFS = require('ipfs/src/http')
const fs = require('fs')
const memdown = require('memdown')
const net = require('net')

// Constants
const contractsPackageDir = `${__dirname}/../contracts`
const truffleBuildDir = `${contractsPackageDir}/build/contracts`
const devJsonConfigPath = `${contractsPackageDir}/build/contracts.json`

const portInUse = (port) =>
  new Promise(function (resolve) {
    const srv = net
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () => srv.once('close', () => resolve(false)).close())
      .listen(port, '0.0.0.0')
  })

const startGanache = (opts = {}) =>
  new Promise((resolve, reject) => {
    console.log('Starting ganache...')
    const ganacheOpts = {
      total_accounts: opts.total_accounts || 5,
      default_balance_ether: 100,
      db_path: `${__dirname}/data/db`,
      network_id: 999,
      mnemonic:
        'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
      // blockTime: 3
    }
    if (opts.inMemory) {
      ganacheOpts.db = memdown()
    } else {
      try {
        fs.mkdirSync(`${__dirname}/data/db`)
      } catch (e) {
        /* Ignore */
      }
    }
    const server = Ganache.server(ganacheOpts)
    const port = 8545
    server.listen(port, (err) => {
      if (err) {
        return reject(err)
      }
      console.log(`Ganache listening on port ${port}.`)
      resolve(server)
    })
  })

const startIpfs = async () => {
  console.log('Start IPFS')
  const ipfs = await IPFS.create({
    repo: `${__dirname}/data/ipfs`,
    preload: {
      enabled: false
    },
    config: {
      Addresses: {
        API: '/ip4/0.0.0.0/tcp/5002',
        Gateway: '/ip4/0.0.0.0/tcp/8080',
        Swarm: []
      },
      Bootstrap: [],
      Discovery: {
        MDNS: { Enabled: false },
        webRTCStar: { Enabled: false }
      }
    }
  })
  const httpAPI = new HttpIPFS(ipfs)
  await httpAPI.start()
  console.log('Started IPFS')
  return httpAPI
}

/**
 * Utility method to update the JSON config file for local network based on
 * addresses of contracts deployed by truffle.
 *  - Look for contracts ABIs in truffle's build directory: packages/contracts/build/contracts/
 *  - Get the contract's address for network 999
 *  - Write the address into the JSON config file packages/contracts/build/contracts.json
 */
function _updateContractsJsonConfig() {
  // Mapping between contract names and their associated key
  // in the JSON file packages/contracts/build/contracts.json
  const contracts = {
    V01_Marketplace: 'Marketplace_V01',
    OriginToken: 'OGN',
    MockOUSD: 'OUSD'
  }

  // 1. Look for contracts ABIs in truffle's build directory
  const addresses = {}
  for (const [contractName, configFieldName] of Object.entries(contracts)) {
    const abiPath = `${truffleBuildDir}/${contractName}.json`
    try {
      const rawAbi = fs.readFileSync(abiPath)
      const abi = JSON.parse(rawAbi)
      const address = abi.networks['999'].address
      addresses[configFieldName] = address
      console.log(`Found ABI for ${contractName}. Address=${address}`)
    } catch (err) {
      console.log(`Failed loading truffle generated ABI at ${abiPath}:`, err)
    }
  }

  // Write the addresses that were collected to packages/contracts/build/contracts.json
  if (!fs.existsSync(devJsonConfigPath)) {
    // If for some reason the config is not present, create an empty one.
    fs.writeFileSync(devJsonConfigPath, '{}')
  }
  try {
    // Read the config file from disk, update the addresses and write it back.
    let config = {}
    if (fs.existsSync(devJsonConfigPath)) {
      const rawConfig = fs.readFileSync(devJsonConfigPath)
      config = JSON.parse(rawConfig)
    }
    config = { ...config, ...addresses }
    fs.writeFileSync(devJsonConfigPath, JSON.stringify(config, null, 2))
    console.log(`Updated ${devJsonConfigPath} with locally deployed addresses`)
  } catch (err) {
    console.log(`Failed updating to ${devJsonConfigPath}:`, err)
  }
}

const deployContracts = () =>
  new Promise((resolve, reject) => {
    console.log('Deploying contracts...')
    const cmd = spawn(`npm`, ['run', 'migrate'], {
      cwd: contractsPackageDir,
      stdio: 'inherit',
      env: process.env
    })
    cmd.on('exit', (code) => {
      if (code === 0) {
        // Now sync the JSON config so that it points to the deployed contracts addresses.
        _updateContractsJsonConfig()
        console.log('Deploying contracts succeeded.')
        resolve()
      } else {
        reject('Deploying contracts failed.')
        reject()
      }
    })
  })

/**
 * Main entry point for the module.
 * @type {{}}
 */
const started = {}
let extrasResult

module.exports = async function start(opts = {}) {
  // Handle starting Ganache (local blockchain).
  if (opts.ganache && !started.ganache) {
    const ganacheOpts = opts.ganache === true ? {} : opts.ganache
    if (await portInUse(8545)) {
      if (!opts.quiet) {
        console.log('Ganache already started')
      }
    } else {
      started.ganache = await startGanache(ganacheOpts)
    }
  }

  // Handle starting a local IPFS daemon.
  if (opts.ipfs && !started.ipfs) {
    if (await portInUse(5002)) {
      if (!opts.quiet) {
        console.log('IPFS already started')
      }
    } else {
      started.ipfs = await startIpfs()
    }
  }

  // Handle compiling and deploying contracts on the local blockchain.
  // Writes the addresses of the deployed contract to the config
  // at packages/contracts/build/contracts.json
  if (opts.deployContracts && !started.contracts) {
    await deployContracts()
    started.contracts = true
  }

  // Shutdown callback. Cleanly terminates any server that was started.
  const shutdownFn = async function shutdown() {
    console.log('Shutting services down...')
    if (started.ganache) {
      await started.ganache.close()
    }
    if (started.ipfs) {
      await started.ipfs.stop()
      await started.ipfs._ipfs.stop()
    }
  }

  shutdownFn.extrasResult = extrasResult

  return shutdownFn
}
