const fs = require('fs')
const path = require('path')
const { trimStart, trimEnd } = require('lodash')
const S3 = require('aws-sdk/clients/s3')

const { isConfigured } = require('../../infra/matrix')
const { walkDir } = require('../../../utils/filesystem')
const { assert } = require('../../../utils/validators')
const { BucketExistence } = require('../../../utils/enums')
const { NETWORK_ID_TO_NAME, BUCKET_PREFIX } = require('../../../utils/const')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.bucket.aws')

let cachedClient = null

function isAvailable({ networkConfig }) {
  return isConfigured(networkConfig, 'aws-files')
}

function configure({ networkConfig }) {
  cachedClient = new S3({
    apiVersion: '2006-03-01',
    accessKeyId: networkConfig.awsAccessKeyId,
    secretAccessKey: networkConfig.awsSecretAccessKey,
    region: networkConfig.awsRegion // Optional
  })
}

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

  const state = await bucketState(bucketName)
  if (state === BucketExistence.PermissionDenied) {
    // TODO: There's a chance we could conflict with another's bucket names
    throw new Error('Bucket name conflict')
  } else if (state === BucketExistence.DoesNotExist) {
    log.debug(`Creating bucket ${bucketName}...`)

    await cachedClient
      .createBucket({
        Bucket: bucketName,
        ACL: 'public-read',
        CreateBucketConfiguration: {
          LocationConstraint: networkConfig.awsRegion
        }
      })
      .promise()

    log.debug('Waiting for bucket to exist...')

    // Could take a moment
    await cachedClient.waitFor('bucketExists', { Bucket: bucketName }).promise()

    log.info(`Bucket ${bucketName} has been created.`)
  }

  await uploadDirectory(bucketName, path.resolve(OutputDir, 'public'))

  log.debug(`Uploaded ${OutputDir} to s3://${bucketName}/`)

  return {
    bucketName,
    url: `s3://${bucketName}/`,
    httpUrl: getHTTPURL(bucketName, networkConfig.awsRegion)
  }
}

/**
 * Return a configured S3 client
 *
 * @returns {object} instance of Storage client
 */
function getClient() {
  if (cachedClient !== null) return cachedClient
  throw new Error('Call configure() first')
}

/**
 * Check if a Bucket exists
 *
 * @param bucketName {string} name of the bucket to instantiate
 * @returns {boolean} if a bucket exists
 */
async function bucketState(bucketName) {
  const s3 = getClient()
  try {
    await s3.headBucket({ Bucket: bucketName }).promise()
    return BucketExistence.Exists
  } catch (err) {
    if (!err.statusCode) {
      log.error('Unexpected error format')
      throw err
    }

    return err.statusCode === 404
      ? BucketExistence.DoesNotExist
      : BucketExistence.PermissionDenied
  }
}

/**
 * Normalize S3 bucket name
 *
 * - Bucket names must be between 3 and 63 characters long.
 * - Bucket names can consist only of lowercase letters, numbers, dots (.), and hyphens (-).
 * - Bucket names must begin and end with a letter or number.
 * - Bucket names must not be formatted as an IP address (for example, 192.168.5.4).
 * - Bucket names can't begin with xn-- (for buckets created after February 2020).
 * - Bucket names must be unique within a partition. A partition is a grouping of Regions. AWS currently has three partitions: aws (Standard Regions), aws-cn (China Regions), and aws-us-gov (AWS GovCloud [US] Regions).
 *
 * Ref: https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
 *
 * @param name {string} name wanted
 * @returns {string} normalized name that fits requirements
 */
function normalizeBucketName(name) {
  name = trimStart(name, '-_.')
  name = trimEnd(name, '-_.')
  if (name.length > 63) {
    name = name.slice(0, 63)
  }
  if (!name.match(/^[A-Za-z0-9\-.]{1,63}$/)) {
    throw new Error(`Unable to normalize bucket name: ${name}`)
  }
  if (name.startsWith('xn--')) {
    throw new Error('Name must not begine with xn--')
  }
  return name
}

/**
 * Upload a file to destination in bucket
 *
 * @param bucketName {string} name of the bucket
 * @param file {string} full path to filename
 * @param destination {string} destination name in bucket
 * @param attempt {number} Number of attempts that have so far (internal)
 * @returns {object} UploadResponse object
 */
async function uploadFile(bucketName, file, destination, attempt = 0) {
  const s3 = getClient()
  const stream = fs.createReadStream(file)
  try {
    return await s3
      .upload({
        Bucket: bucketName,
        Key: destination,
        ACL: 'public-read',
        Body: stream
      })
      .promise()
  } catch (err) {
    // TODO: AWS responds 502s?  This was copied from GCP.
    if (err && err.code === 502 && attempt < 3) {
      return await uploadFile(bucketName, file, destination, attempt + 1)
    }

    throw err
  }
}

/**
 * Recursively upload all files in updir to bucket
 *
 * @param bucketName {string} name of the bucket
 * @param updir {string} path to directory to upload
 */
async function uploadDirectory(bucketName, updir) {
  const files = await walkDir(updir)

  for (const file of files) {
    const destination = trimStart(file.replace(updir, ''), '/')
    log.debug(`Uploading ${file} to s3://${bucketName}/${destination}...`)
    await uploadFile(bucketName, file, destination)
  }
}

/**
 * Given a bucketName, return public HTTP URL to said bucket
 *
 * @param bucketName {string} name of bucket
 * @param region {string} AWS Region
 * @returns {string} HTTP URL to bucket
 */
function getHTTPURL(bucketName, region) {
  if (region) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/`
  }
  return `https://${bucketName}.s3.amazonaws.com/`
}

module.exports = {
  BucketExistence,
  bucketState,
  isAvailable,
  configure,
  deploy
}
