const { Shop, Network } = require('../models')
const deploy = require('../logic/deploy')
const { getLogger } = require('../utils/logger')

const queues = require('./queues')
const logger = getLogger('queues.deploymentProcessor')

const attachToQueue = () => {
  const queue = queues['deploymentQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

const processor = async (job) => {
  const log = (progress, str) => {
    logger.debug(`[${progress}%] ${str}`)
    job.log(str)
    job.progress(progress)
  }

  log(10, 'Starting deploy job.')

  const { networkId, subdomain, shopId, resourceSelection, uuid } = job.data

  log(15, 'Loading job details...')

  const network = await Network.findOne({ where: { networkId } })
  if (!network) throw new Error('Invalid network')

  const shop = await Shop.findOne({ where: { id: shopId } })
  if (!shop) throw new Error('Unknown shop')

  log(20, 'Starting deployment...')

  const { success, error, message } = await deploy({
    uuid,
    networkId: networkId ? networkId : network.networkId,
    subdomain,
    shop,
    resourceSelection
  })

  log(90, 'Deployment run completed')

  if (!success && error) {
    log(95, 'Deployment run failed')
    throw new Error(message)
  }

  log(100, 'Deploy job finished.')
}

module.exports = { processor, attachToQueue }
