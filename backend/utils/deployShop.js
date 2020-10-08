const deploy = require('ipfs-deploy')
const ipfsClient = require('ipfs-http-client')
const fs = require('fs')
const { execFile } = require('child_process')

const { ShopDeploymentStatuses } = require('../enums')
const { ShopDeployment, ShopDeploymentName } = require('../models')
const { autosslQueue } = require('../queues/queues')
const { getLogger } = require('../utils/logger')

const { getConfig } = require('./encryptedConfig')
const prime = require('./primeIpfs')
const setCloudflareRecords = require('./dns/cloudflare')
const setCloudDNSRecords = require('./dns/clouddns')
const setRoute53Records = require('./dns/route53')

const { IS_TEST } = require('../utils/const')

const log = getLogger('utils.deployShop')
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

const PROTOCOL_LABS_GATEWAY = 'https://gateway.ipfs.io'
const PINATA_API = 'https://api.pinata.cloud'
const PINATA_GATEWAY = 'https://gateway.pinata.cloud'

// Max age of a deployment before it is considered as failed.
const MAX_PENDING_DEPLOYMENT_AGE = 10 * 60 * 1000 // 10 min

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

  if (dnsProvider === 'aws') {
    if (!networkConfig.awsAccessKeyId || !networkConfig.awsSecretAccessKey) {
      log.warn('AWS DNS Proider selected but no credentials configured!')
    } else {
      await setRoute53Records({
        ipfsGateway: gatewayHost,
        zone,
        subdomain,
        hash,
        credentials: {
          accessKeyId: networkConfig.awsAccessKeyId,
          secretAccessKey: networkConfig.awsSecretAccessKey
        }
      })
    }
  }

  if (!['cloudflare', 'gcp', 'aws'].includes(dnsProvider)) {
    log.error('Unknown DNS provider selected.  Will not configure DNS')
  }
}

/**
 * Internal logic for deploying a shop.
 *
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
 * @throws
 */
async function _deployShop({
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

  log.info(`Shop ${shop.id}: Preparing data for deploy...`)
  log.info(`Outputting to ${OutputDir}/public`)
  await new Promise((resolve, reject) => {
    execFile('rm', ['-rf', `${OutputDir}/public`], (error, stdout) => {
      if (error) reject(error)
      else resolve(stdout)
    })
  })

  let publicShopConfig = {}
  try {
    const raw = fs.readFileSync(`${OutputDir}/data/config.json`)
    publicShopConfig = JSON.parse(raw.toString())
  } catch (e) {
    log.warning(`Shop ${shop.id}: failed parsing ${OutputDir}/data/config.json`)
    // TODO: Under which circumstances would it be ok for this to not be a hard error?
  }

  await new Promise((resolve, reject) => {
    const distDir = publicShopConfig.themeId
      ? `themes/${publicShopConfig.themeId}`
      : 'dist'
    execFile(
      'cp',
      ['-r', `${__dirname}/../${distDir}`, `${OutputDir}/public`],
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

  const networkName =
    network.networkId === 1
      ? 'mainnet'
      : network.networkId === 4
      ? 'rinkeby'
      : 'localhost'

  function replaceVars(html) {
    return html
      .replace('TITLE', publicShopConfig.fullTitle)
      .replace('META_DESC', publicShopConfig.metaDescription || '')
      .replace('DATA_DIR', dataDir)
      .replace(/NETWORK/g, networkName)
      .replace('FAVICON', publicShopConfig.favicon || 'favicon.ico')
      .replace('UI_SRC', networkConfig.uiCdn || '')
  }

  const html = fs.readFileSync(`${OutputDir}/public/index.html`).toString()
  fs.writeFileSync(`${OutputDir}/public/index.html`, replaceVars(html))

  const cdnHtml = fs.readFileSync(`${OutputDir}/public/cdn.html`).toString()
  fs.writeFileSync(`${OutputDir}/public/cdn.html`, replaceVars(cdnHtml))

  // Note: for legacy reasons, the URLs for the IPFS Gateway and API are stored in
  // the network.ipfs/ipfsApi fields while other configs are stored under network.config.
  const ipfsClusterConfigured =
    network.ipfsApi && networkConfig.ipfsClusterPassword
  const pinataConfigured = networkConfig.pinataKey && networkConfig.pinataSecret

  // Build a list of all configured pinners.
  let ipfsPinner, ipfsGateway
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
      ipfsPinner = maddr
      ipfsGateway = network.ipfs
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
      ipfsPinner = PINATA_API
      ipfsGateway = PINATA_GATEWAY
    }
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

  // Configure DNS.
  let domain, hostname
  if (subdomain) {
    log.info('Configuring DNS...')
    domain = dnsProvider ? `https://${subdomain}.${zone}` : null
    hostname = `${subdomain}.${zone}`
    await configureShopDNS({
      network,
      subdomain,
      zone,
      hash: ipfsHash,
      dnsProvider
    })
    if (domain && network.ipfs) {
      // Intentionally not awaiting on this so we can return to the user faster
      await autosslQueue.add({
        url: domain,
        host: network.ipfs
      })
    }
  }

  return { ipfsHash, ipfsPinner, ipfsGateway, domain, hostname }
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
 * @throws
 */
async function deployShop(args) {
  const { shop } = args

  // Check if there is any pending deployment to prevent concurrent deployments.
  const pendingDeployment = await ShopDeployment.findOne({
    where: {
      shopId: shop.id,
      status: ShopDeploymentStatuses.Pending
    }
  })
  if (pendingDeployment) {
    // There is a pending deployment. There is a slight chance a deployment
    // may have been interrupted by a server crash or a maintenance, causing it
    // to never finish.
    const age = Date.now() - pendingDeployment.createdAt
    if (age > MAX_PENDING_DEPLOYMENT_AGE) {
      // Mark the deployment as failed.
      log.warn(
        `Shop ${shop.id}: Found stale pending deployment ${pendingDeployment.id}. Updating it as failed.`
      )
      await pendingDeployment.update({
        status: ShopDeploymentStatuses.Failure,
        error: `Stale pending deployment`
      })
    } else {
      log.error(
        `Shop ${shop.id}: concurrent deployment running. Can not start a new deploy.`
      )
      throw new Error(
        `The shop is already being published. Try again in a few minutes.`
      )
    }
  }

  // Create a deployment row in the DB.
  const deployment = await ShopDeployment.create({
    shopId: shop.id,
    status: ShopDeploymentStatuses.Pending
  })

  let result
  try {
    // Deploy the shop.
    const deployFn = IS_TEST && args.deployFn ? args.deployFn : _deployShop
    result = await deployFn(args)
  } catch (e) {
    log.error(`Shop ${shop.id} deployment failure: ${e}`)
    // Record the deployment failure in the DB.
    await deployment.update({
      status: ShopDeploymentStatuses.Failure,
      error: e.toString()
    })
    // Rethrow to notify the caller of the failure.
    throw e
  }

  const { ipfsHash, ipfsPinner, ipfsGateway, domain, hostname } = result

  // Record the deployment name in the DB.
  if (hostname) {
    // There could be an existing entry by the same hash/hostname.
    // For example if a store gets redeployed without changes, its hash remains identical.
    const deploymentName = await ShopDeploymentName.findOne({
      where: { ipfsHash, hostname }
    })
    if (!deploymentName) {
      await ShopDeploymentName.create({
        ipfsHash,
        hostname
      })
    }
  }

  // Update the deployment in the DB.
  await deployment.update({
    status: ShopDeploymentStatuses.Success,
    domain,
    ipfsPinner,
    ipfsGateway,
    ipfsHash
  })
  log.info(
    `Deployed shop ${shop.id}: deployment id=${deployment.id} domain=${domain} hash=${ipfsHash}`
  )

  return { hash: ipfsHash, domain }
}

module.exports = {
  configureShopDNS,
  deployShop
}
