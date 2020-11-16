/**
 * Shop deployment module
 *
 * Overview
 * ========
 * This module abstracts away a lot of steps in the deployment of a shop dapp.
 * It will upload build to a bucket, IPFS, configure a CDN, and then DNS.
 *
 * Common Process
 * --------------
 *
 * 1) Assembles a shop build by copying files from the reference build to a
 *    build directory.  Replaces template placeholders.  Copies configuration
 *    data directory into the build.
 * 2) Uploads the build to a GCS/S3 bucket
 * 3) Uploads the build to IPFS
 * 4) Configures a CDN to serve said bucket
 * 5) Configure DNS to point at either the CDN (if available) or the IPFS
 *    gateway
 */
const {
  validateSelection,
  canUseResource,
  canUseResourceType,
  isConfigured
} = require('@origin/dshop-validation/matrix')

const { Network } = require('../../models')
const { queues } = require('../../queues')
const { ShopDomainStatuses } = require('../../utils/enums')
const { decryptConfig } = require('../../utils/encryptedConfig')
const { getLogger } = require('../../utils/logger')
const { getMyIP } = require('../../utils/ip')
const { assert } = require('../../utils/validators')
const { DSHOP_CACHE, DEFAULT_INFRA_RESOURCES } = require('../../utils/const')

const {
  deploymentLock,
  passDeployment,
  failDeployment,
  getShopDomain,
  createShopDomain
} = require('./records')
const { assembleBuild } = require('./build')
const { deployToIPFS } = require('./ipfs')
const { deployToBucket } = require('./bucket')
const { configureShopDNS } = require('./dns')
const { configureCDN } = require('./cdn')
const { DuplicateDeploymentError } = require('./common')

const log = getLogger('logic.deploy')

const ERROR_DEBUG = 999 // do not use
const ERROR_GENERAL = 1000
const ERROR_INVALID_NETWORK = 1001
const ERROR_DEPLOYMENT_PENDING = 1002
const ERROR_INVALID_RESOURCES = 1003
const DEPLOY_ERRORS = {
  [ERROR_DEBUG]: 'DEBUG BREAK',
  [ERROR_GENERAL]: 'Unknown error',
  [ERROR_INVALID_NETWORK]: 'Given network is not valid or not configured',
  [ERROR_INVALID_RESOURCES]: 'Given infra resources are not able to be used',
  [ERROR_DEPLOYMENT_PENDING]:
    'The shop is already being published. Try again in a few minutes.'
}

/**
 * Error response builder for deploy()
 *
 * @param error {number} - An error ID
 * @returns {object} - deploy() response
 */
function error(errorId, message = null) {
  return {
    success: false,
    error: true,
    id: errorId,
    message: message
      ? message
      : errorId in DEPLOY_ERRORS
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
 * @param args {object}
 * @param args.networkId {number} - Network ID to use for configuration
 * @param args.subdomain {string} - Subdomain we should configure for DNS
 * @param args.shop {object} - A Shop loaded from DB
 * @param args.dnsProvider {string} - The DNS provider to use to configure the
 *    domain name (optional)
 * @param args.pinner {string} - Pinner to use (optional)
 * @param args.skipSSLProbe - Don't bother to run the AutoSSL probe.
 *    This is especially useful for testing since the non-redis queues do not
 *    run asynchronously.
 * @param args.overrides {object} - Deployment module overrides (used for
 *    testing)
 * @param args.overrides.assembleBuild - Build assembly function
 * @param args.overrides.deployToBucket - Bucket deployment function
 * @param args.overrides.configureCDN - CDN configuration function
 * @param args.overrides.deployToIPFS - IPFS deployment function
 * @param args.overrides.configureShopDNS - DNS configuration function
 * @returns {object} - deploy() response
 */
async function deploy({
  networkId,
  shop,
  subdomain,
  resourceSelection,
  uuid,
  skipSSLProbe = false,
  overrides = {}
}) {
  assert(!!networkId, 'networkId must be provided to deploy()')
  assert(!!shop, 'shop must be provided to deploy()')
  assert(!!subdomain, 'subdomain must be provided to deploy()')
  /* TODO: For now we're falling back to a default but want node admins to set
  this explicitly at some point.
  assert(
    !!resourceSelection && resourceSelection instanceof Array,
    'resourceSelection must be an Array'
  )*/

  /**
   * We have the ability to override functions within deployment for unit
   * testing.
   */
  let assemble = assembleBuild
  let bucketDeploy = deployToBucket
  let ipfsDeploy = deployToIPFS
  let cdnConfig = configureCDN
  let dnsConfig = configureShopDNS
  if (overrides) {
    if (overrides.assembleBuild) {
      log.warn(`Deployment function assembleBuild() has been overridden`)
      assemble = overrides.assembleBuild
    }
    if (overrides.deployToBucket) {
      log.warn(`Deployment function deployToBucket() has been overridden`)
      bucketDeploy = overrides.deployToBucket
    }
    if (overrides.deployToIPFS) {
      log.warn(`Deployment function deployToIPFS() has been overridden`)
      ipfsDeploy = overrides.deployToIPFS
    }
    if (overrides.configureCDN) {
      log.warn(`Deployment function configureCDN() has been overridden`)
      cdnConfig = overrides.configureCDN
    }
    if (overrides.configureShopDNS) {
      log.warn(`Deployment function configureShopDNS() has been overridden`)
      dnsConfig = overrides.configureShopDNS
    }
  }

  const network = await Network.findOne({ where: { networkId } })
  if (!network) {
    return error(ERROR_INVALID_NETWORK)
  }
  const start = +new Date()
  const networkConfig = decryptConfig(network.config)
  const zone = networkConfig.domain
  const fqdn = `${subdomain}.${zone}`
  const dataDir = shop.authToken
  const OutputDir = `${DSHOP_CACHE}/${dataDir}`

  // Make sure the selected infra resources are a valid and configured combination
  if (resourceSelection) {
    const selectionValidation = validateSelection({
      networkConfig,
      selection: resourceSelection
    })
    if (!selectionValidation.success) {
      log.error('The infra resource selection is invalid!')
      return error(
        ERROR_INVALID_RESOURCES,
        selectionValidation.errors.join(', ')
      )
    }
  } else {
    /** Using DEFAULT_INFRA_RESOURCES for now
    if (!networkConfig.defaultResourceSelection) {
      throw new Error(
        'Unable to figure out which infra resources to deploy with!'
      )
    }*/
    // TODO: Remove these defaults eventually
    if (!networkConfig.defaultResourceSelection) {
      log.warn(
        `Falling back to default infra resources: ${DEFAULT_INFRA_RESOURCES.join(
          ', '
        )}`
      )
    }
    resourceSelection =
      networkConfig.defaultResourceSelection || DEFAULT_INFRA_RESOURCES
  }

  log.debug(`Infra resource selection: ${resourceSelection.join(', ')}`)

  let deployment, ipfsHash, ipfsPinner, ipfsGateway, dnsProvider

  if (isConfigured(networkConfig, 'gcp-dns')) {
    dnsProvider = 'gcp'
  } else if (isConfigured(networkConfig, 'cloudflare-dns')) {
    dnsProvider = 'cloudflare'
  } else if (isConfigured(networkConfig, 'aws-dns')) {
    dnsProvider = 'aws'
  }

  /**
   * Deployment locking.  No concurrent deployments per shop
   *
   * NOTE: This will never happen on a single-worker local system (with redis)
   * when being run from Bull queue.  Each Bull worker can only run one job at a
   * time, so don't expect to be able to test out deployment locking that way.
   * That said there are unit tests that test this functionality (skipping the
   * queue), and non-redis instances are run synchronously.
   */
  log.info(`Getting deployment lock...`)
  try {
    deployment = await deploymentLock(shop.id, uuid)
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
  log.info(`Assembling build...`)
  try {
    await assemble({
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
  log.info(`Deploying to bucket...`)
  if (
    canUseResource({
      networkConfig,
      selection: resourceSelection,
      id: 'gcp-files'
    }) ||
    canUseResource({
      networkConfig,
      selection: resourceSelection,
      id: 'aws-files'
    })
  ) {
    try {
      const responses = await bucketDeploy({
        networkConfig,
        shop,
        OutputDir,
        dataDir,
        resourceSelection
      })
      if (responses.length > 0) {
        bucketUrls = responses.map((r) => r.url)
        bucketHttpUrls = responses.map((r) => r.httpUrl)
        await deployment.update({
          bucketUrls: bucketUrls.join(','),
          bucketHttpUrls: bucketHttpUrls.join(',')
        })
      }
    } catch (err) {
      log.error(`Unknown error deploying to bucket.`)
      log.error(err)
      await failDeployment(deployment, 'Failed to deploy to bucket')
      return error(ERROR_GENERAL)
    }
  } else {
    log.debug(`Bucket deployment either not selected or not configured`)
  }

  /**
   * Configure the CDN(s) to point at bucket(s)
   */
  let ipAddresses = null
  if (
    shop.enableCdn &&
    canUseResourceType({
      networkConfig,
      selection: resourceSelection,
      type: 'cdn'
    })
  ) {
    log.info(`Configuring CDN...`)

    try {
      const responses = await cdnConfig({
        networkConfig,
        shop,
        deployment,
        domains: [fqdn],
        resourceSelection
      })
      if (responses.length > 0) {
        ipAddresses = responses.map((r) => r.ipAddress)
      }
    } catch (err) {
      log.error(`Unknown error configuring CDN.`)
      log.error(err)
      await failDeployment(deployment, 'Failed to configure CDN')
      return error(ERROR_GENERAL)
    }
  }

  /**
   * Deploy the shop to IPFS
   */
  log.info(`Deploying shop to IPFS...`)
  if (
    canUseResource({
      networkConfig,
      selection: resourceSelection,
      id: 'ipfs-cluster'
    }) ||
    canUseResource({
      networkConfig,
      selection: resourceSelection,
      id: 'ipfs-pinata'
    })
  ) {
    try {
      const ipfsRes = await ipfsDeploy({
        shop,
        network,
        networkConfig,
        OutputDir,
        dataDir,
        resourceSelection
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
  }

  /**
   * Configure DNS by pointing it at either the configured CDN (if available) or
   * to the IPFS gateway.
   */
  if (
    canUseResourceType({
      networkConfig,
      selection: resourceSelection,
      type: 'dns'
    }) &&
    subdomain
  ) {
    log.info(`Configuring DNS...`)
    try {
      await dnsConfig({
        networkConfig,
        subdomain,
        zone,
        hash: ipfsHash,
        resourceSelection,
        ipAddresses
      })
    } catch (err) {
      log.error(`Unknown error configuring DNS`)
      log.error(err)
      await failDeployment(deployment, 'Failed to configure DNS')
      return error(ERROR_GENERAL)
    }
  }

  // Set record of IP/IPFS hash to name relation
  log.info(`Updating shop domain records...`)
  const names = await getShopDomain({ shopId: shop.id })
  if (names && names.length > 0) {
    for (const dn of names) {
      if (ipAddresses) {
        for (const ip of ipAddresses) {
          await dn.update({
            ipfsPinner,
            ipfsGateway,
            ipfsHash,
            ipAddress: ip,
            status: ShopDomainStatuses.Pending
          })
        }
      } else {
        await dn.update({
          ipfsPinner,
          ipfsGateway,
          ipfsHash,
          status: ShopDomainStatuses.Pending
        })
      }
    }
  } else {
    if (ipAddresses) {
      for (const ip of ipAddresses) {
        await createShopDomain({
          shopId: shop.id,
          domain: fqdn,
          ipfsPinner,
          ipfsGateway,
          ipfsHash,
          ipAddress: ip
        })
      }
    } else {
      await createShopDomain({
        shopId: shop.id,
        domain: fqdn,
        ipfsPinner,
        ipfsGateway,
        ipfsHash
      })
    }
  }

  // Schedule autossl probe to try and kickstart the cert issuer
  if (!skipSSLProbe) {
    log.info(`Queueing AutoSSL probe...`)
    if (ipAddresses) {
      // CDN deployment
      for (const ip of ipAddresses) {
        await queues.autosslQueue.add({
          url: `https://${fqdn}/`,
          host: ip
        })
      }
    } else {
      // Hosted by backend
      await queues.autosslQueue.add({
        url: `https://${fqdn}/`,
        host: await getMyIP()
      })
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
    ipfsHash
  })
  return success({
    hash: ipfsHash,
    domain, // TODO: Bad name since this is a URL
    bucketHttpUrls
  })
}

module.exports = deploy
