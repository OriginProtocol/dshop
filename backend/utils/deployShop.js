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

  const remotePinners = []

  const ipfsDeployCredentials = {}
  if (network.ipfsApi && networkConfig.ipfsClusterPassword) {
    const maddr = urlToMultiaddr(network.ipfsApi, {
      translateLocalhostPort: 9094
    })
    log.info(`Connecting to cluster ${maddr}`)
    ipfsDeployCredentials['ipfsCluster'] = {
      host: maddr,
      username: networkConfig.ipfsClusterUser || 'dshop',
      password: networkConfig.ipfsClusterPassword
    }
    remotePinners.push('ipfs-cluster')
  }

  if (networkConfig.pinataKey && networkConfig.pinataSecret) {
    ipfsDeployCredentials['pinata'] = {
      apiKey: networkConfig.pinataKey,
      secretApiKey: networkConfig.pinataSecret
    }
    remotePinners.push('pinata')
  }

  // Deploy the shop to IPFS.
  let hash, ipfsGateway
  const publicDirPath = `${OutputDir}/public`
  if (
    (networkConfig.pinataKey &&
      networkConfig.pinataSecret &&
      pinner === 'pinata') ||
    (network.ipfsApi &&
      networkConfig.ipfsClusterPassword &&
      pinner === 'ipfs-cluster')
  ) {
    ipfsGateway = 'https://gateway.pinata.cloud'
    hash = await deploy({
      publicDirPath,
      remotePinners,
      siteDomain: dataDir,
      credentials: ipfsDeployCredentials
    })
    if (!hash) {
      throw new Error('ipfs-error')
    }
    log.info(`Deployed shop on ${pinner}. Hash=${hash}`)
    await prime(`https://gateway.ipfs.io/ipfs/${hash}`, publicDirPath)
    await prime(`https://ipfs-prod.ogn.app/ipfs/${hash}`, publicDirPath)
    if (networkConfig.pinataKey) {
      await prime(`https://gateway.pinata.cloud/ipfs/${hash}`, publicDirPath)
    }
    if (networkConfig.ipfsGateway) {
      await prime(`${networkConfig.ipfsGateway}/ipfs/${hash}`, publicDirPath)
    }
  } else if (network.ipfsApi.indexOf('localhost') > 0) {
    ipfsGateway = network.ipfs
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

  let domain
  if (subdomain) {
    domain = dnsProvider ? `https://${subdomain}.${zone}` : null
    await configureShopDNS({ network, subdomain, zone, hash, dnsProvider })
    if (domain && network.ipfs) {
      // Intentionally not awating on this so we can return to the user faster
      triggerAutoSSL(domain, network.ipfs)
    }
  }

  if (hash) {
    // Record the deployment in the DB.
    try {
      const deployment = await ShopDeployment.create({
        shopId: shop.id,
        domain,
        ipfsGateway,
        ipfsHash: hash
      })

      if (subdomain) {
        await ShopDeploymentName.create({
          ipfsHash: hash,
          hostname: `${subdomain}.${zone}`
        })
      }

      log.info(
        `Recorded shop deployment in the DB. id=${deployment.id} domain=${domain} ipfs=${ipfsGateway} hash=${hash}`
      )
    } catch (e) {
      log.error('Error creating ShopDeployment', e)
    }
  }

  return { hash, domain }
}

module.exports = { configureShopDNS, deployShop }
