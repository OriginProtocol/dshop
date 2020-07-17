const deploy = require('ipfs-deploy')
const ipfsClient = require('ipfs-http-client')
const fs = require('fs')
const { execFile } = require('child_process')

const { ShopDeployment, ShopDeploymentName } = require('../models')
const { autosslQueue } = require('../queues/queues')
const { getLogger } = require('../utils/logger')

const { getConfig } = require('./encryptedConfig')
const prime = require('./primeIpfs')
const setCloudflareRecords = require('./dns/cloudflare')
const setCloudDNSRecords = require('./dns/clouddns')

const log = getLogger('utils.deployShop')
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

const PROTOCOL_LABS_GATEWAY = 'https://gateway.ipfs.io'
const PINATA_API = 'https://api.pinata.cloud'
const PINATA_GATEWAY = 'https://gateway.pinata.cloud'

/**
 * Convert an HTTP URL into a multiaddr
 */
function urlToMultiaddr(v, opts) {
  const { translateLocalhostPort = null } = opts
  const url = new URL(v)
  // TODO: ipv6?
  const addrProto = url.hostname.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/)
    ? 'ip4'
    : 'dns4'
  let port = url.port
  if (!url.port) {
    if (url.protocol === 'https:') {
      port = `443`
    } else if (url.protocol === 'http:') {
      port = 80
    } else {
      throw new Error(`Unsupoorted protocol ${url.protocol}!`)
    }
  } else {
    if (translateLocalhostPort && LOCAL_HOSTS.includes(url.hostname)) {
      port = translateLocalhostPort
    }
  }
  return `/${addrProto}/${url.hostname}/tcp/${port}/${url.protocol.slice(
    0,
    -1
  )}${url.pathname}`
}

async function configureShopDNS({
  network,
  subdomain,
  zone,
  hash,
  dnsProvider
}) {
  const networkConfig = getConfig(network.config)
  const gatewayURL = new URL(network.ipfs)
  const gatewayHost = gatewayURL.hostname

  if (dnsProvider === 'cloudflare') {
    if (!networkConfig.cloudflareApiKey) {
      log.warn('Cloudflare DNS Proider selected but no credentials configured!')
    } else {
      await setCloudflareRecords({
        ipfsGateway: gatewayHost,
        zone,
        subdomain,
        hash,
        email: networkConfig.cloudflareEmail,
        key: networkConfig.cloudflareApiKey
      })
    }
  }

  if (dnsProvider === 'gcp') {
    if (!networkConfig.gcpCredentials) {
      log.warn('GCP DNS Proider selected but no credentials configured!')
    } else {
      await setCloudDNSRecords({
        ipfsGateway: gatewayHost,
        zone,
        subdomain,
        hash,
        credentials: networkConfig.gcpCredentials
      })
    }
  }

  if (!['cloudflare', 'gcp'].includes(dnsProvider)) {
    log.error('Unknown DNS provider selected.  Will not configure DNS')
  }
}

/**
 * Deploys a DShop
 * @param {string} OutputDir: directory to use for preparing the set of files to deploy.
 * @param {string} dataDir: name of the directory for storing the shop's data files.
 * @param {models.Network} network: network configuration DB object.
 * @param {string} subdomain
 * @param {models.Shop} shop: shop DB object.
 * @param {string} pinner: Pinner service to use for deploying the shop's data. 'ipfs-cluster' or 'pinata'.
 *        NOTE: Currently this argument is ignored and the data is deployed to all the pinners configured.
 *        If for example an IPFS cluster and Pinata are configured, both are used for deployment.
 * @param {string} dnsProvider: DNS provider to use for configuring the domain. 'gcp' or 'cloudflare'
 * @returns {Promise<{domain: string, hash: string}>} Domain configured and IPFS hash of the deployment.
 */
async function deployShop({
  OutputDir,
  dataDir,
  network,
  subdomain,
  shop,
  pinner,
  dnsProvider
}) {
  const networkConfig = getConfig(network.config)
  const zone = networkConfig.domain

  log.info('Preparing data for deploy...')
  await new Promise((resolve, reject) => {
    execFile('rm', ['-rf', `${OutputDir}/public`], (error, stdout) => {
      if (error) reject(error)
      else resolve(stdout)
    })
  })

  await new Promise((resolve, reject) => {
    execFile(
      'cp',
      ['-r', `${__dirname}/../dist`, `${OutputDir}/public`],
      (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      }
    )
  })

  await new Promise((resolve, reject) => {
    execFile(
      'cp',
      ['-r', `${OutputDir}/data`, `${OutputDir}/public/${dataDir}`],
      (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      }
    )
  })

  let publicShopConfig = {}
  try {
    const raw = fs.readFileSync(`${OutputDir}/data/config.json`)
    publicShopConfig = JSON.parse(raw.toString())
  } catch (e) {
    /* Ignore */
  }

  const networkName =
    network.networkId === 1
      ? 'mainnet'
      : network.networkId === 4
      ? 'rinkeby'
      : 'localhost'

  const html = fs.readFileSync(`${OutputDir}/public/index.html`).toString()
  fs.writeFileSync(
    `${OutputDir}/public/index.html`,
    html
      .replace('TITLE', publicShopConfig.fullTitle)
      .replace('META_DESC', publicShopConfig.metaDescription || '')
      .replace('DATA_DIR', dataDir)
      .replace('NETWORK', networkName)
      .replace('FAVICON', publicShopConfig.favicon || 'favicon.ico')
  )

  // Note: for legacy reasons, the URLs for the IPFS Gateway and API are stored in
  // the network.ipfs/ipfsApi fields while other configs are stored under network.config.
  const ipfsClusterConfigured =
    network.ipfsApi && networkConfig.ipfsClusterPassword
  const pinataConfigured = networkConfig.pinataKey && networkConfig.pinataSecret

  // Build a list of all configured pinners.
  let pinnerUrl, pinnerGatewayUrl
  const remotePinners = []
  const ipfsDeployCredentials = {}
  if (ipfsClusterConfigured) {
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
    if (pinner === 'ipfs-cluster') {
      pinnerUrl = maddr
      pinnerGatewayUrl = network.ipfs
    }
  }

  if (pinataConfigured) {
    log.info(`Pinata configured. Adding to the list of pinners.`)
    ipfsDeployCredentials['pinata'] = {
      apiKey: networkConfig.pinataKey,
      secretApiKey: networkConfig.pinataSecret
    }
    remotePinners.push('pinata')
    if (pinner === 'pinata') {
      pinnerUrl = PINATA_API
      pinnerGatewayUrl = PINATA_GATEWAY
    }
  }

  // Deploy the shop to all the configured IPFS pinners.
  let hash
  const publicDirPath = `${OutputDir}/public`
  if (remotePinners.length > 0) {
    hash = await deploy({
      publicDirPath,
      remotePinners,
      siteDomain: dataDir,
      credentials: ipfsDeployCredentials
    })
    if (!hash) {
      throw new Error('IPFS deploy error')
    }
    log.info(`Deployed shop to ${remotePinners.length} pinners. Hash=${hash}`)

    // Prime various IPFS gateways.
    log.info('Priming gateways...')
    await prime(`${PROTOCOL_LABS_GATEWAY}/ipfs/${hash}`, publicDirPath)
    if (networkConfig.pinataKey) {
      await prime(`${PINATA_GATEWAY}/ipfs/${hash}`, publicDirPath)
    }
    if (network.ipfs) {
      await prime(`${network.ipfs}/ipfs/${hash}`, publicDirPath)
    }
  } else if (network.ipfsApi.indexOf('localhost') > 0) {
    // Local dev deployment.
    const ipfs = ipfsClient(network.ipfsApi)
    const allFiles = []
    const glob = ipfsClient.globSource(publicDirPath, { recursive: true })
    for await (const file of ipfs.add(glob)) {
      allFiles.push(file)
    }
    hash = String(allFiles[allFiles.length - 1].cid)
    log.info(`Deployed shop on local IPFS. Hash=${hash}`)
  } else {
    log.warn(
      'Shop not deployed to IPFS: Pinner service not configured and not a dev environment.'
    )
  }

  // Configure DNS.
  let domain
  if (subdomain) {
    log.info('Configuring DNS...')
    domain = dnsProvider ? `https://${subdomain}.${zone}` : null
    await configureShopDNS({ network, subdomain, zone, hash, dnsProvider })
    if (domain && network.ipfs) {
      // Intentionally not awaiting on this so we can return to the user faster
      await autosslQueue.add({
        url: domain,
        host: network.ipfs
      })
    }
  }

  if (hash) {
    // Record the deployment in the DB.
    try {
      const deployment = await ShopDeployment.create({
        shopId: shop.id,
        domain,
        ipfsPinner: pinnerUrl,
        ipfsGateway: pinnerGatewayUrl,
        ipfsHash: hash
      })

      if (subdomain) {
        const hostname = `${subdomain}.${zone}`
        // There could be an existing entry by the same hash/hostname.
        // For example if a store gets redeployed without changes, its hash remains identical.
        const deploymentName = await ShopDeploymentName.findOne({
          where: { ipfsHash: hash, hostname }
        })
        if (!deploymentName) {
          await ShopDeploymentName.create({
            ipfsHash: hash,
            hostname
          })
        }
      }

      log.info(
        `Recorded shop deployment in the DB. id=${deployment.id} domain=${domain} hash=${hash}`
      )
    } catch (e) {
      log.error('Error recording the shop deployment in the DB', e)
    }
  }

  return { hash, domain }
}

module.exports = { configureShopDNS, deployShop }
