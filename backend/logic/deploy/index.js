const { Network } = require('../../models')
const { decryptConfig } = require('../../utils/encryptedConfig')
const { getLogger } = require('../../utils/logger')
const { assert } = require('../../utils/validators')
const { DSHOP_CACHE } = require('../../utils/const')

const { deploymentLock, passDeployment, failDeployment } = require('./records')
const { assembleBuild } = require('./build')
const { deployToIPFS } = require('./ipfs')
const { deployToBucket } = require('./bucket')
const { configureShopDNS } = require('./dns')
const { DuplicateDeploymentError } = require('./common')

const log = getLogger('logic.deploy')

const ERROR_DEBUG = 999 // do not use
const ERROR_GENERAL = 1000
const ERROR_INVALID_NETWORK = 1001
const ERROR_DEPLOYMENT_PENDING = 1002
const DEPLOY_ERRORS = {
  [ERROR_DEBUG]: 'DEBUG BREAK',
  [ERROR_GENERAL]: 'Unknown error',
  [ERROR_INVALID_NETWORK]: 'Given network is not valid or not configured',
  [ERROR_DEPLOYMENT_PENDING]:
    'The shop is already being published. Try again in a few minutes.'
}

/**
 * Error response builder for deploy()
 *
 * @param error {number} - An error ID
 * @returns {object} - deploy() response
 */
function error(errorId) {
  return {
    success: false,
    error: true,
    id: errorId,
    message:
      errorId in DEPLOY_ERRORS
        ? DEPLOY_ERRORS[errorId]
        : DEPLOY_ERRORS[ERROR_GENERAL]
  }
}

/**
 * Success response builder for deploy()
 *
 * @param response {object} - Response data to return
 * @returns {object} - deploy() response
 */
function success(obj = {}) {
  return {
    success: true,
    error: false,
    ...obj
  }
}

/**
 * Deploy a shop
 *
 * @param networkId {number} - Network ID to use for configuration
 * @param subdomain {string} - Subdomain we should configure for DNS
 * @param shop {object} - A Shop loaded from DB
 * @param dnsProvider {string} - The DNS provider to use to configure the domain
 *    name (optional)
 * @param pinner {string} - Pinner to use (optional)
 * @returns {object} - deploy() response
 */
async function deploy({ networkId, shop, subdomain, dnsProvider, pinner }) {
  assert(
    typeof networkId !== 'undefined',
    'networkId must be provided to deploy()'
  )
  assert(typeof shop !== 'undefined', 'shop must be provided to deploy()')

  const network = await Network.findOne({ where: { networkId } })
  if (!network) {
    return error(ERROR_INVALID_NETWORK)
  }
  const start = +new Date()
  const networkConfig = decryptConfig(network.config)
  const zone = networkConfig.domain
  const dataDir = shop.authToken
  const OutputDir = `${DSHOP_CACHE}/${dataDir}`

  let deployment, ipfsHash, ipfsPinner, ipfsGateway

  if (!dnsProvider) {
    if (networkConfig.gcpCredentials) {
      dnsProvider = 'gcp'
    } else if (networkConfig.cloudflareApiKey) {
      dnsProvider = 'cloudflare'
    } else if (networkConfig.awsAccessKeyId) {
      dnsProvider = 'aws'
    }
  }

  /**
   * Deployment locking.  No concurrent deployments per shop
   */
  try {
    deployment = await deploymentLock(shop.id)
  } catch (err) {
    if (err instanceof DuplicateDeploymentError) {
      return error(ERROR_DEPLOYMENT_PENDING)
    }

    log.error(`Unknown error creating deployment lock.`)
    log.error(err)
    return error(ERROR_GENERAL)
  }

  /**
   * Assemble the shop dapp build for deployment
   */
  try {
    await assembleBuild({
      network,
      networkConfig,
      shop,
      OutputDir,
      dataDir
    })
  } catch (err) {
    log.error(`Unknown error building shop.`)
    log.error(err)
    await failDeployment(deployment, 'Failed to build shop')
    return error(ERROR_GENERAL)
  }

  /**
   * Deploy the shop to a service-provider agnostic bucket
   */
  let bucketUrls = []
  let bucketHttpUrls = []
  try {
    const responses = await deployToBucket({
      networkConfig,
      shop,
      OutputDir,
      dataDir
    })
    if (responses.length > 0) {
      bucketUrls = responses.map((r) => r.url)
      bucketHttpUrls = responses.map((r) => r.httpUrl)
    }
  } catch (err) {
    log.error(`Unknown error deploying to bucket.`)
    log.error(err)
    await failDeployment(deployment, 'Failed to deploy to bucket')
    return error(ERROR_GENERAL)
  }

  /**
   * Deploy the shop to IPFS
   */
  try {
    const ipfsRes = await deployToIPFS({
      shop,
      network,
      networkConfig,
      OutputDir,
      dataDir,
      pinner
    })
    ipfsHash = ipfsRes.ipfsHash
    ipfsPinner = ipfsRes.ipfsPinner
    ipfsGateway = ipfsRes.ipfsGateway
  } catch (err) {
    log.error(`Unknown error deploying to IPFS`)
    log.error(err)
    await failDeployment(deployment, 'Failed to deploy to IPFS')
    return error(ERROR_GENERAL)
  }

  /**
   * Deploy the shop to IPFS
   */
  if (subdomain) {
    try {
      await configureShopDNS({
        network,
        networkConfig,
        subdomain,
        zone,
        hash: ipfsHash,
        dnsProvider
      })
    } catch (err) {
      log.error(`Unknown error configuring DNS`)
      log.error(err)
      await failDeployment(deployment, 'Failed to configure DNS')
      return error(ERROR_GENERAL)
    }
  }

  const end = +new Date()
  const deployTimeSeconds = Math.floor((end - start) / 1000)
  log.info(`Deploy duration (shop_id: ${shop.id}): ${deployTimeSeconds}s`)

  // We good
  const domain = dnsProvider ? `https://${subdomain}.${zone}` : null
  await passDeployment(deployment, {
    domain,
    ipfsPinner,
    ipfsGateway,
    ipfsHash,
    bucketUrls: bucketUrls.join(','),
    bucketHttpUrls: bucketHttpUrls.join(',')
  })
  return success({
    hash: ipfsHash,
    domain,
    bucketHttpUrls
  })
}

module.exports = deploy
