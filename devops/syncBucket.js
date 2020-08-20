/**
 * Sync a Cloud Storage bucket with local FS
 */
const fs = require('fs').promises
const { createReadStream } = require('fs')
const path = require('path')
const program = require('commander')
const { Storage } = require('@google-cloud/storage')

// Cache
let STORAGE_CLIENT, BUCKET

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

async function sync(bucketName, dir, opts) {
  const bucket = getBucket(bucketName)
  const [files] = await bucket.getFiles()

  for (const file of files) {
    console.log(`Syncing ${file.name}`)

    const fname = path.basename(file.name)
    const destination = path.join(dir, file.name)
    const parent = path.dirname(destination)

    if (parent) {
      try {
        const parentStat = await fs.stat(parent)

        if (!parentStat.isDirectory()) {
          throw new Error(`${parent} is not a directory`)
        }
      } catch (err) {
        if (err.toString().includes('ENOENT')) {
          await fs.mkdir(parent, { recursive: true })
        } else {
          throw new Error(`Error statting ${parent}: ${err.toString()}`)
        }
      }
    }

    await bucket.file(file.name).download({ destination })
  }
}

async function main(argv) {
  program
    .arguments('<bucketName> <dir>')
    .action(async (bucketName, dir, opts) => {
      await sync(bucketName, dir, opts)
    })
    .parse(argv)
}

if (require.main === module) {
  main(process.argv)
}
