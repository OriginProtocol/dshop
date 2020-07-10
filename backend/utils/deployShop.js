const deploy = require('ipfs-deploy')
const ipfsClient = require('ipfs-http-client')
const fs = require('fs')
const { execFile } = require('child_process')

const { ShopDeployment, ShopDeploymentName } = require('../models')
const { getLogger } = require('../utils/logger')

const { getConfig } = require('./encryptedConfig')
const prime = require('./primeIpfs')
const { getHTTPS } = require('./http')
const setCloudflareRecords = require('./dns/cloudflare')
const setCloudDNSRecords = require('./dns/clouddns')

const log = getLogger('utils.deployShop')
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']
const AUTOSSL_MAX_ATTEMPTS = 5
const AUTOSSL_BACKOFF = 30000

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

/**
 * Trigger AutoSSL to generate cert
 *
 * @param url {T} URL object or string to connect to
 * @returns {boolean} if it was successful
 */
async function triggerAutoSSL(url, autoSSLHost) {
  let success = false
  let attempts = 1

  url = url instanceof URL ? url : new URL(url)
  const hostname = url.hostname
  url.hostname = autoSSLHost.includes('//')
    ? autoSSLHost.split('//').slice(-1)
    : autoSSLHost

  log.debug(`Making request to ${url.hostname} with header (Host: ${hostname})`)

  for (;;) {
    try {
      await getHTTPS({
        host: url.hostname,
        path: url.pathname,
        port: url.port || 443,
        servername: hostname,
        headers: {
          host: hostname
        }
      })
      success = true
      break
    } catch (err) {
      log.info(
        `Error when attempting to trigger AutoSSL on attempt ${attempts}:`,
        err
      )

      if (attempts <= AUTOSSL_MAX_ATTEMPTS) {
        // sleep with backoff
        await (async () => {
          log.debug(
            `AutoSSL trigger backing off by ${attempts * AUTOSSL_BACKOFF}ms`
          )
          return new Promise((resolve) =>
            setTimeout(resolve, attempts * AUTOSSL_BACKOFF)
          )
        })()

        attempts += 1
      } else {
        break
      }
    }
  }

  if (!success) {
    log.error('Error trying to auto-trigger AutoSSL')
  } else {
    log.debug('AutoSSL trigger completed')
  }

  return success
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
  let pinnerUrl
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
      pinnerUrl = 'https://api.pinata.cloud'
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
    await prime(`https://gateway.ipfs.io/ipfs/${hash}`, publicDirPath)
    if (networkConfig.pinataKey) {
      await prime(`https://gateway.pinata.cloud/ipfs/${hash}`, publicDirPath)
    }
    if (networkConfig.ipfs) {
      await prime(`${networkConfig.ipfs}/ipfs/${hash}`, publicDirPath)
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
      triggerAutoSSL(domain, network.ipfs)
    }
  }

  if (hash) {
    // Record the deployment in the DB.
    try {
      const deployment = await ShopDeployment.create({
        shopId: shop.id,
        domain,
        ipfsPinner: pinnerUrl,
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
