const deploy = require('ipfs-deploy')
const ipfsClient = require('ipfs-http-client')
const { isConfigured } = require('@origin/dshop-validation/matrix')

const prime = require('../../utils/primeIpfs')
const { urlToMultiaddr } = require('../../utils/multiaddr')
const {
  PROTOCOL_LABS_GATEWAY,
  PINATA_API,
  PINATA_GATEWAY
} = require('../../utils/const')
const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.deploy.ipfs')

/**
 * Deploy a build in OutputDir to IPFS
 *
 * @param args {object}
 * @param args.shop {object} - Shop model instance
 * @param args.network {object} - Network model instance
 * @param args.networkConfig {object} - Decrypted network config
 * @param args.OutputDir {string} - Path to build direcotry
 * @param args.dataDir {string} - Path to datadir
 * @param args.pinner {string} - IPFS pinner to use (optional)
 * @returns {object} - object with relevant IPFS deployment details
 */
async function deployToIPFS({
  shop,
  network,
  networkConfig,
  OutputDir,
  dataDir,
  resourceSelection
}) {
  if (!resourceSelection && network.ipfsApi.indexOf('http://localhost') < 0) {
    return false
  }

  // Build a list of all configured pinners.
  let ipfsPinner, ipfsGateway
  const remotePinners = []
  const ipfsDeployCredentials = {}
  if (
    resourceSelection.includes('ipfs-cluster') &&
    isConfigured(networkConfig, 'ipfs-cluster')
  ) {
    const maddr = urlToMultiaddr(network.ipfsApi, {
      translateLocalhostPort: 9094
    })
    log.info(
      `IPFS cluster configured at ${maddr}. Adding to the list of pinners.`
    )
    ipfsDeployCredentials['ipfsCluster'] = {
      host: maddr,
      username: networkConfig.ipfsClusterUser || 'dshop', // username can be anything when authenticating to the cluster.
      password: networkConfig.ipfsClusterPassword
    }
    remotePinners.push('ipfs-cluster')
    ipfsPinner = maddr
    ipfsGateway = network.ipfs
  }

  if (
    resourceSelection.includes('ipfs-pinata') &&
    isConfigured(networkConfig, 'ipfs-pinata')
  ) {
    log.info(`Pinata configured. Adding to the list of pinners.`)
    ipfsDeployCredentials['pinata'] = {
      apiKey: networkConfig.pinataKey,
      secretApiKey: networkConfig.pinataSecret
    }
    remotePinners.push('pinata')
    ipfsPinner = PINATA_API
    ipfsGateway = PINATA_GATEWAY
  }

  // Deploy the shop to all the configured IPFS pinners.
  let ipfsHash
  const publicDirPath = `${OutputDir}/public`
  if (remotePinners.length > 0) {
    ipfsHash = await deploy({
      publicDirPath,
      remotePinners,
      siteDomain: dataDir,
      credentials: ipfsDeployCredentials,
      writeLog: log.info,
      writeError: log.error
    })
    if (!ipfsHash) {
      throw new Error('IPFS deploy error')
    }
    log.info(
      `Deployed shop to ${remotePinners.length} pinners. Hash=${ipfsHash}`
    )

    // Prime various IPFS gateways.
    log.info('Priming gateways...')
    await prime(`${PROTOCOL_LABS_GATEWAY}/ipfs/${ipfsHash}`, publicDirPath)
    if (networkConfig.pinataKey) {
      await prime(`${PINATA_GATEWAY}/ipfs/${ipfsHash}`, publicDirPath)
    }
    if (network.ipfs) {
      await prime(`${network.ipfs}/ipfs/${ipfsHash}`, publicDirPath)
    }
  } else if (network.ipfsApi.indexOf('localhost') > 0) {
    // Local dev deployment.
    const ipfs = ipfsClient(network.ipfsApi)
    const file = await ipfs.add(
      ipfsClient.globSource(publicDirPath, { recursive: true })
    )
    ipfsHash = String(file.cid)
    ipfsPinner = network.ipfsApi
    ipfsGateway = network.ipfs
    log.info(`Deployed shop on local IPFS. Hash=${ipfsHash}`)
  } else {
    throw new Error('Shop not deployed to IPFS: Pinner service not configured')
  }

  await shop.update({
    hasChanges: false
  })

  return { ipfsHash, ipfsPinner, ipfsGateway }
}

module.exports = { deployToIPFS }
