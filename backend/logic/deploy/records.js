/**
 * Funcitonality for deployment records in the database
 */
const { ShopDeploymentStatuses } = require('../../enums')
const { ShopDeployment } = require('../../models')
const { assert } = require('../../utils/validators')
const { getLogger } = require('../../utils/logger')

const { DuplicateDeploymentError } = require('./common')

const log = getLogger('logic.deploy.records')

// Max age of a deployment before it is considered as failed.
const MAX_PENDING_DEPLOYMENT_AGE = 10 * 60 * 1000 // 10 min

async function failDeployment(deployment, errorMessage) {
  await deployment.update({
    status: ShopDeploymentStatuses.Failure,
    error: errorMessage
  })
}

/**
 * Set a deployment as succeeded
 */
async function passDeployment(deployment, props) {
  await deployment.update({
    status: ShopDeploymentStatuses.Success,
    ...props
  })
}

/**
 * Create a shop deployment record
 */
async function createDeployment(
  shopId,
  status = ShopDeploymentStatuses.Pending
) {
  assert(status in ShopDeploymentStatuses, 'Invalid deployment status')

  return await ShopDeployment.create({
    shopId,
    status
  })
}

async function getDeployment(shopId, status = ShopDeploymentStatuses.Pending) {
  return await ShopDeployment.findOne({
    where: {
      shopId,
      status
    }
  })
}

async function deploymentLock(shopId) {
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
      throw new DuplicateDeploymentError(
        'There is already an existing deployment in progress'
      )
    }
  }

  return createDeployment(shopId)
}

module.exports = {
  getDeployment,
  deploymentLock,
  createDeployment,
  passDeployment,
  failDeployment
}
