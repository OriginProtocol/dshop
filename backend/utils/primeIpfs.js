const fs = require('fs')
const https = require('https')
const http = require('http')
const Bottleneck = require('bottleneck')
const limiter = new Bottleneck({ maxConcurrent: 10 })
const { readdir } = fs.promises
const { resolve } = require('path')
const { getLogger } = require('../utils/logger')

const log = getLogger('utils.primeIpfs')

limiter.on('error', (err) => {
  log.error(`Error occurred when priming:`, err)
})

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files)
}

async function download(url) {
  await new Promise((resolve) => {
    const f = fs.createWriteStream('/dev/null').on('finish', resolve)
    log.info(`Priming ${url}`)
    const httpModule = url.startsWith('https://') ? https : http
    httpModule
      .get(url, (response) => response.pipe(f))
      .on('error', (err) => {
        log.error(`Error making GET request to ${url}:`, err)
      })
  })
}

async function prime(urlPrefix, dir) {
  const filesWithPath = await getFiles(dir)
  const files = filesWithPath.map((f) => f.split('public/')[1]).filter((f) => f)
  for (const file of files) {
    const url = `${urlPrefix}/${file}`
    limiter.schedule((url) => download(url), url)
  }
}

module.exports = prime
