const path = require('path')
const trimStart = require('lodash/trimStart')
const { Storage } = require('@google-cloud/storage')

const { NETWORK_ID_TO_NAME, BUCKET_PREFIX } = require('../../../utils/const')
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
 * Normalize GCS bucket name
 *
 * Ref: https://cloud.google.com/storage/docs/naming-buckets
 *
 * @param name {string} name wanted
 * @returns {string} normalized name that fits requirements
 */
function normalizeBucketName(name) {
  name = trimStart(name, '-_.')
  if (name.length > 63) {
    name = name.slice(0, 63)
  }
  if (!name.match(/^[A-Za-z0-9\-_.]{1,63}$/)) {
    throw new Error(`Unable to normalize bucket name: ${name}`)
  }
  return name
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

  const networkName =
    shop.networkId in NETWORK_ID_TO_NAME
      ? NETWORK_ID_TO_NAME[shop.networkId]
      : 'localhost'
  const bucketName = normalizeBucketName(
    `${BUCKET_PREFIX}${networkName}-${shop.authToken}`
  )

  let bucket = await getBucket(bucketName)
  const [exists] = await bucket.exists()
  if (!exists) {
    log.debug(`Bucket ${bucketName} does not exist. Creating...`)
    const cres = await bucket.create({
      website: {
        mainPageSuffix: 'index.html',
        notFoundPage: 'index.html'
      }
    })
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

/**
 * Return a configured Storage client
 *
 * @returns {object} instance of Storage client
 */
function getClient() {
  if (cachedClient !== null) return cachedClient
  throw new Error('Call configure() first')
}

/**
 * Return a Bucket instance for bucketName
 *
 * @param bucketName {string} name of the bucket to instantiate
 * @returns {object} instance of Bucket
 */
async function getBucket(bucketName) {
  const client = getClient()
  return client.bucket(bucketName)
}

/**
 * Upload a file to destination in bucket
 *
 * @param bucket {object} Bucket instance
 * @param file {string} full path to filename
 * @param destination {string} destination name in bucket
 * @param attempt {number} Number of attempts that have so far (internal)
 * @returns {object} UploadResponse object
 */
async function uploadFile(bucket, file, destination, attempt = 0) {
  try {
    return await bucket.upload(file, {
      destination,
      public: true
    })
  } catch (err) {
    if (err && err.code === 502 && attempt < 3) {
      return await uploadFile(bucket, file, destination, attempt + 1)
    }

    throw err
  }
}

/**
 * Recursively upload all files in updir to bucket
 *
 * @param bucket {Object} instance of Bucket
 * @param updir {string} path to directory to upload
 */
async function uploadDirectory(bucket, updir) {
  const files = await walkDir(updir)

  for (const file of files) {
    const destination = trimStart(file.replace(updir, ''), '/')
    log.debug(`Uploading ${file} to gs://${bucket.name}/${destination}...`)
    await uploadFile(bucket, file, destination)
  }
}

/**
 * Given a bucketName, return public HTTP URL to said bucket
 *
 * @param bucketName {string} name of bucket
 * @returns {string} HTTP URL to bucket
 */
function getHTTPURL(bucketName) {
  return `https://storage.googleapis.com/${bucketName}/`
}

module.exports = {
  isAvailable,
  configure,
  deploy
}
