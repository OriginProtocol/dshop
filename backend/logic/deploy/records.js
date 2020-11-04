/**
 * Functionality for deployment records in the database
 */
const { ShopDeployment, ShopDomain } = require('../../models')
const {
  ShopDomainStatuses,
  ShopDeploymentStatuses
} = require('../../utils/enums')
const { assert } = require('../../utils/validators')
const { getLogger } = require('../../utils/logger')

const { DuplicateDeploymentError } = require('./common')

const log = getLogger('logic.deploy.records')

// Max age of a deployment before it is considered as failed.
const MAX_PENDING_DEPLOYMENT_AGE = 10 * 60 * 1000 // 10 min

/**
 * Set a deployment as failed with given errorMessage
 *
 * @param deployment {object} - ShopDeployment model instance
 * @param errorMessage {string} - Error message to store
 */
async function failDeployment(deployment, errorMessage) {
  await deployment.update({
    status: ShopDeploymentStatuses.Failure,
    error: errorMessage
  })
}

/**
 * Set a deployment as succeeded
 *
 * @param deployment {object} - ShopDeployment model instance
 * @param props {object} - Any extra model propreties to set
 */
async function passDeployment(deployment, props) {
  await deployment.update({
    status: ShopDeploymentStatuses.Success,
    ...props
  })
}

/**
 * Create a shop deployment record
 *
 * @param shopId {number} - Shop ID to create a deployment for
 * @param uuid {string} - A UUID identifier that can be used for later retrieval
 * @param status {ShopDeploymentStatuses} - ShopDeploymentStatuses enum value
 */
async function createDeployment(
  shopId,
  uuid,
  status = ShopDeploymentStatuses.Pending,
  error
) {
  assert(status in ShopDeploymentStatuses, 'Invalid deployment status')

  return await ShopDeployment.create({
    shopId,
    status,
    uuid,
    error
  })
}

/**
 * Get a ShopDeploymentName associated with an IPFS hash
 *
 * @param where {object} - Args to use for WHERE clause
 * @param where.ipfsHash {string} - An IPFS hash
 * @param where.ipAddress {string} - An IP address
 * @returns {ShopDeploymentName} - ShopDeploymentName instance
 */
async function getShopDomain(where) {
  return await ShopDomain.findAll({
    where
  })
}

/**
 * Create a name for a deployment (e.g. DNS name)
 *
 * @param hostname {string} - A hostname that to associate with..
 * @param ipfsHash {string} - An IPFS hash
 * @returns {ShopDeploymentName} - ShopDeploymentName instance
 */
async function createShopDomain({
  shopId,
  domain,
  ipfsPinner,
  ipfsGateway,
  ipfsHash,
  ipAddress
}) {
  assert(!!shopId, 'Missing domain')
  assert(!!domain, 'Missing domain')

  return await ShopDomain.create({
    shopId,
    status: ShopDomainStatuses.Pending,
    domain,
    ipfsPinner,
    ipfsGateway,
    ipfsHash,
    ipAddress
  })
}

/**
 * Get a deployment record for a shop with the given status
 *
 * @param shopId {number} - Shop ID to create a deployment for
 * @param status {ShopDeploymentStatuses} - ShopDeploymentStatuses enum value
 */
async function getDeployment(shopId, status = ShopDeploymentStatuses.Pending) {
  return await ShopDeployment.findOne({
    where: {
      shopId,
      status
    }
  })
}

/**
 * Get a deployment record by its assigned UUID
 *
 * @param shopId {number} - Shop ID to create a deployment for
 * @param uuid {string} - A UUID identifier that can be used for later retrieval
 * @param status {ShopDeploymentStatuses} - ShopDeploymentStatuses enum value
 */
async function getDeploymentByUUID(uuid) {
  return await ShopDeployment.findOne({
    where: {
      uuid
    }
  })
}

/**
 * Act as a lock for pending deployments.  Return a ShopDeployment if there are
 * no conflicts, or throw a DuplicateDeploymentError if there's a known pending
 * deployment still active and unexpired.
 *
 * @param shopId {number} - Shop ID to create a deployment for
 * @param uuid {string} - A UUID identifier that can be used for later retrieval
 * @returns {object} - ShopDeployment model instance
 */
async function deploymentLock(shopId, uuid) {
  const deployment = await getDeployment(shopId)

  if (deployment) {
    // There is a pending deployment. There is a slight chance a deployment
    // may have been interrupted by a server crash or a maintenance, causing it
    // to never finish.
    const age = Date.now() - deployment.createdAt
    if (age > MAX_PENDING_DEPLOYMENT_AGE) {
      // Mark the deployment as failed.
      log.warn(
        `Shop ${shopId}: Found stale pending deployment ${deployment.id}. Updating it as failed.`
      )
      await failDeployment(deployment, 'Expired')
    } else {
      log.error(
        `Shop ${shopId}: concurrent deployment running. Can not start a new deploy.`
      )

      // So the deployment status can be looked up
      await createDeployment(
        shopId,
        uuid,
        ShopDeploymentStatuses.Failure,
        'There is already a deployment running. Try again in a few minutes.'
      )

      throw new DuplicateDeploymentError(
        'There is already an existing deployment in progress'
      )
    }
  }

  return createDeployment(shopId, uuid)
}

module.exports = {
  getDeployment,
  getDeploymentByUUID,
  deploymentLock,
  createDeployment,
  getShopDomain,
  createShopDomain,
  passDeployment,
  failDeployment
}
