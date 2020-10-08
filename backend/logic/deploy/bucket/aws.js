/* eslint-disable no-unused-vars */
// TODO: the above is temporary until implementation
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.bucket.aws')

function isAvailable({ networkConfig }) {
  log.warn('AWS s3 bucket deploy not yet ipmlemented')
  // return !!networkConfig.awsAccessKeyId && !!networkConfig.awsSecretAccessKey
  return false
}

function configure({ networkConfig }) {
  return true
}

async function deploy({ networkConfig, OutputDir, dataDir }) {
  log.warn('bucket.aws.deploy has not been implemented!')
}

module.exports = {
  isAvailable,
  configure,
  deploy
}
