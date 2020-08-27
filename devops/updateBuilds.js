/**
 * Updates UI build and builds.json, (optionally) uploads them to bucket, and
 * adds and pins the build to IPFS.
 *
 * Usage
 * -----
 * node devops/updateBuilds.js <buildDir> <bucketName)
 *
 *
 * Example
 * -------
 * node devops/updateBuilds.js /tmp/uibuild/ dshop-ui-staging
 */
const fs = require('fs').promises
const { createReadStream } = require('fs')
const path = require('path')
const program = require('commander')
const { Storage } = require('@google-cloud/storage')
const pinataSDK = require('@pinata/sdk')


let TMPD
const MAX_RECURSION_DEPTH = 5
const BUILDS_MAX = 5 // Total builds to keep in BUILDS_FILENAME
const BUILDS_FILENAME = 'builds.json'
const FILE_HASH_PATTERN = /app\.([A-Za-z0-9]+)\.(css|js)/

// Cache
let STORAGE_CLIENT, BUCKET

function ext(filename) {
  return filename.split('.').slice(-1)
}

function stripLeadingHash(s) {
  return s.startsWith('/') ? s.slice(1) : s
}

async function getTemp() {
  if (TMPD) return TMPD
  TMPD = await fs.mkdtemp('updateBuilds')
  return TMPD
}

function getStorageClient() {
  if (STORAGE_CLIENT) return STORAGE_CLIENT
  STORAGE_CLIENT = new Storage()
  return STORAGE_CLIENT
}

function getBucket(bucketName) {
  if (BUCKET) return BUCKET
  const storage = getStorageClient()
  BUCKET = storage.bucket(bucketName)
  return BUCKET
}

/**
 * List files in a given directory
 *
 * @param buildDir {string} - Directory to traverse
 * @returns {Array} - directory contents
 */
async function ls(buildDir) {
  const ds = await fs.stat(buildDir)
  if (!ds.isDirectory()) throw new Error(`${buildDir} is not a directory`)
  return (await fs.readdir(buildDir)).map(f => path.join(buildDir, f))
}

/**
 * Find the build hash from the given build files
 *
 * @param files {Array} - build files
 * @param exclude {Array} - hashes to ignore
 * @returns {string} - build hash
 */
function getNewHash(files, exclude=[]) {
  // Find the first hash in the first matching file
  for (const f of files) {
    const match = f.match(FILE_HASH_PATTERN)

    if (match && !exclude.includes(match[1])) {
      return match[1]
    }
  }

  throw new Error('Hash not found in build files')
}

/**
 * Check if a build exists in buildsJSON by hash
 *
 * @param buildsJSON {Array} - of build objects
 * @param buildHash {string} - build hash to look for
 * @returns {boolean} - if build exists
 */
function buildExists(buildsJSON, buildHash) {
  for (const build of buildsJSON) {
    if (build.hash === buildHash) {
      return true
    }
  }

  return false
}

/**
 * Remove old builds from given JS objects structures
 *
 * @param files {Array} - of build objects
 * @param files {Array} - of build files
 * @returns {Array} - of build objects
 */
async function cleanOldBuilds(buildsJSON, buildFiles) {
  // sort for good measure
  buildsJSON.sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

  if (buildsJSON.length > BUILDS_MAX) {
    return buildsJSON.slice(-BUILDS_MAX)
  }

  // shift off oldest hash
  if (buildsJSON.length === BUILDS_MAX) {
    const oldBuild = buildsJSON.shift()

    process.stdout.write(`Will remove build ${oldBuild.hash} from bucket.\n`)

    for (const file of buildFiles) {
      if (file.metadata.name.includes(oldBuild.hash)) {
        process.stdout.write(`Deleting ${file.metadata.name} from bucket...\n`)
        await file.delete()
      }
    }
  }

  // delete all files with hash
  return buildsJSON
}

/**
 * Load old build filenames from bucket
 *
 * @param bucketName {string} - Google Cloud Storage bucket containing build
 *  artifacts
 * @returns {Array} - of build artifacts
 */
async function loadOldBuilds(bucketName) {
  const bucket = getBucket(bucketName)
  const retv = await bucket.getFiles()
  return retv[0]
}

/**
 * Load current builds.json from bucket
 *
 * @param bucketName {string} - Google Cloud Storage bucket containing build
 *  artifacts
 * @returns {Array} - of build objects
 */
function loadBuildsJSON(bucketName) {
  return new Promise((resolve, reject) => {
    let buf = ''
    const bucket = getBucket(bucketName)
    const buildJSONFile = bucket.file(BUILDS_FILENAME)

    buildJSONFile.createReadStream()
      .on('error', (err) => { reject(err) })
      .on('data', (data) => {
        buf += data
       })
      .on('end', function() {
        resolve(JSON.parse(buf))
      })
  })
}

/**
 * Copy files to bucket
 *
 * @param bucketName {string} - Bucket to upload to
 * @param files {Array} - Files to copy to bucket
 * @param depth {Number} - Recusion depth
 * @returns {Array} of promises
 */
async function uploadNewFiles(bucketName, files, buildDir, depth = 1) {
  const promises = []
  const bucket = getBucket(bucketName)

  if (depth > MAX_RECURSION_DEPTH) {
    throw new Error('Max recusion depth reached!')
  }

  for (const file of files) {
    const fstat = await fs.stat(file)
    if (fstat.isDirectory()) {
      const parentFiles = await ls(file)
      const parentProms = await uploadNewFiles(
        bucketName,
        parentFiles,
        buildDir,
        depth + 1
      )

      promises.splice(promises.length, 0, ...parentProms)
    } else {
      process.stdout.write(`Uploading ${file}...\n`)

      const key = stripLeadingHash(file.replace(buildDir, ''))
      promises.push(bucket.upload(file, {
        gzip: true,
        destination: key
      }))
    }
  }

  return promises
}

/**
 * Copy updated builds.json to bucket
 *
 * @param bucketName {string} - Name of the build bucket
 * @param buildJSON {Array} - builds.json JS object structure
 * @param newHash {string} - the hash from the webpack build
 * @param opts {object} - options object
 * @param opts.upload {boolean} - if build.json should be uploaded to the bucket
 * @returns {string} - full path of builds.json file
 */
async function updateBuildsJSON(bucketName, buildsJSON, newHash, opts) {
  if (!bucketName || typeof bucketName !== 'string') {
    throw new Error('bucketName appears to be an invalid format')
  }
  if (!buildsJSON || !(buildsJSON instanceof Array)) {
    throw new Error('Builds JSON appears to be an invalid format')
  }
  if (!newHash || typeof newHash !== 'string') {
    throw new Error('newHash appears to be an invalid format')
  }

  // Update with enw build
  buildsJSON.push({
    hash: newHash,
    timestamp: Math.floor(+new Date() / 1000)
  })

  const bucket = getBucket(bucketName)
  const tmp = opts.tmp || await getTemp()
  const buildsJSONFile = path.join(tmp, BUILDS_FILENAME)

  await fs.writeFile(buildsJSONFile, JSON.stringify(buildsJSON))

  if (opts.upload) {
    await bucket.upload(buildsJSONFile, {
      gzip: true,
      destination: BUILDS_FILENAME
    })
  }

  return buildsJSONFile
}

/**
 * Copy updated builds.json to bucket
 *
 * @param pth {string} - Path to add to IPFS
 * @returns {string} - IPFS hash of newly added file/directory
 */
async function addToIPFS(pth) {
  let ipfsHash

  if (process.env.PINATA_API_KEY) {
    const apiKey = process.env.PINATA_API_KEY
    const secretKey = process.env.PINATA_SECRET_API_KEY
    const pinata = pinataSDK(apiKey, secretKey)
    const resp = await pinata.pinFromFS(pth, {
      name: 'uibuild'
    })
    ipfsHash = resp.IpfsHash
  }

  return ipfsHash
}

/**
 * Update the build artifacts
 *
 * @param buildDir {string} - Build directory to work with
 * @param bucketName {string} - Build bucket name
 * @param opts {object} - options object
 * @param opts.upload {boolean} - if build.json should be uploaded to the bucket
 * @param opts.add {boolean} - if build files should be added to IPFS
 */
async function updateBuilds(buildDir, bucketName, opts) {
  opts.tmp = opts.tmp ? opts.tmp : await getTemp()
  const buildFiles = await ls(buildDir)
  const files = await loadOldBuilds(bucketName)
  const buildsJSON = await loadBuildsJSON(bucketName)
  const newHash = getNewHash(buildFiles, buildsJSON.map(x => x.hash))
  const newFiles = buildFiles.filter(f => {
    const match = f.match(FILE_HASH_PATTERN)

    // Not a hashed file
    if (!match) return true

    // Newly hashed file
    return f.includes(newHash)
  })

  // Don't update if the hash exists already
  if (buildExists(buildsJSON, newHash)) {
    process.stdout.write('Nothing to do.\n')
    process.exit()
  }

  // GC old builds
  cleanOldBuilds(buildsJSON, files)

  // Update the bucket
  if (opts.upload) {
    // This returns a promise for every file uploading
    const proms = await uploadNewFiles(bucketName, newFiles, buildDir)
    await Promise.all(proms)
  }

  const buildsFile = await updateBuildsJSON(
    bucketName,
    buildsJSON,
    newHash,
    opts
  )

  // If we're not uploading, we probably want to include builds.json with known
  // artifacts
  if (!opts.upload) {
    await fs.copyFile(buildsFile, path.join(buildDir, BUILDS_FILENAME))
  }

  if (opts.add) {
    process.stdout.write(`Adding build files to IPFS...\n`)
    const hash = await addToIPFS(buildDir)
    if (hash) {
      process.stdout.write(`Hash: ${hash}\n`)
      if (opts.hashFile) {
        await fs.writeFile(opts.hashFile, hash, { flag: 'w' })
      }
    } else {
      process.stdout.write(`ERR\n`)
      process.stderr.write(`Failed to add files to IPFS!`)
      process.exit(1)
    }
  }
}

async function main(argv) {
  program
    .option('-u, --upload', 'do not upload to bucket')
    .option('-a, --add', 'add build dir to IPFS')
    .option('-i, --hash-file <hashFile>', 'save hash to a file')
    .arguments('<buildDir> <bucketName>')
    .action(async (buildDir, bucketName, opts) => {
      try {
        await updateBuilds(buildDir, bucketName, opts)
      } catch(err) {
        process.stderr.write(err.toString())
        process.exit(1)
      }
    })
    .parse(argv)

}

if (require.main === module) {
  main(process.argv)
}
