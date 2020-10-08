const path = require('path')
const trimStart = require('lodash/trimStart')
const { Storage } = require('@google-cloud/storage')

const { BUCKET_PREFIX } = require('../../../utils/const')
const { walkDir } = require('../../../utils/filesystem')
const { assert } = require('../../../utils/validators')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.bucket.gcp')

let cachedClient = null

/**
 * Check if GCP is configured and we can deploy to it
 *
 * @param args {Object}
 * @param args.networkConfig {Object} - Decrypted networkConfig object
 * @returns {bool} - if we can deploy
 */
function isAvailable({ networkConfig }) {
  return !!networkConfig.gcpCredentials
}

/**
 * Configure this singleton for a use
 *
 * @param args {Object}
 * @param args.networkConfig {Object} - Decrypted networkConfig object
 * @param args.credentials {Object} - GCP credentials (if networkConfig not provided)
 */
function configure({ networkConfig, credentials }) {
  let creds = credentials ? credentials : networkConfig.gcpCredentials

  if (typeof creds === 'string') {
    creds = JSON.parse(creds)
  }

  cachedClient = new Storage({
    projectId: creds.project_id, // Shrug
    credentials: creds
  })
}

/**
 * Deploy OutputDir to a properly named bucket
 *
 * @param args {Object}
 * @param args.networkConfig {Object} - Decrypted networkConfig object
 * @param args.OutputDir {string} - The directory containing the shop build
 */
async function deploy({ shop, networkConfig, OutputDir }) {
  assert(!!networkConfig, 'networkConfig must be provided')
  assert(!!OutputDir, 'OutputDir must be provided')

  const bucketName = `${BUCKET_PREFIX}${shop.authToken}`

  let bucket = await getBucket(bucketName)
  const [exists] = await bucket.exists()
  if (!exists) {
    log.debug(`Bucket ${bucketName} does not exist. Creating...`)
    const cres = await bucket.create()
    bucket = cres[0]

    // This needs to be explicit for whatever reason
    await bucket.makePublic({ includeFiles: true, force: true })
  }

  await uploadDirectory(bucket, path.resolve(OutputDir, 'public'))

  log.debug(`Uploaded ${OutputDir} to gs://${bucket.name}/`)

  return {
    bucketName: bucket.name,
    url: `gs://${bucket.name}/`,
    httpUrl: getHTTPURL(bucket.name)
  }
}

function getClient(credentials) {
  if (cachedClient !== null) return cachedClient

  assert(
    typeof credentials !== 'undefined',
    'Either call configureClient() first or provide credentials to getClient()'
  )

  configure({ credentials })
  return cachedClient
}

async function getBucket(bucketName) {
  const client = getClient()
  return client.bucket(bucketName)
}

async function uploadDirectory(bucket, updir) {
  const files = await walkDir(updir)

  for (const file of files) {
    const destination = trimStart(file.replace(updir, ''), '/')
    log.debug(`Uploading ${file} to gs://${bucket.name}/${destination}...`)
    await bucket.upload(file, {
      destination,
      public: true
    })
  }
}

function getHTTPURL(bucketName) {
  return `https://storage.googleapis.com/${bucketName}/`
}

module.exports = {
  isAvailable,
  configure,
  deploy
}
