const fs = require('fs')
const sharp = require('sharp')
const uniq = require('lodash/uniq')

const { getLogger } = require('../../../utils/logger')

const log = getLogger('utils.printfu.resizePrintfulMockups')

async function resizePrintfulMockups({ OutputDir, force }) {
  const filesRaw = fs.readFileSync(`${OutputDir}/printful-images.json`)
  const files = JSON.parse(filesRaw)
  const fileIds = uniq(files.filter((f) => !f.skip).map((f) => f.id))
  const forceMsg = force ? ' (force)' : ''
  log.info(`Resizing mockups for ${fileIds.length} products${forceMsg}...`)

  for (const fileId of fileIds) {
    const inputDir = `${OutputDir}/data/${fileId}/orig`
    const outputFileDir = `${OutputDir}/data/${fileId}/520`

    fs.mkdirSync(outputFileDir, { recursive: true })
    const images = fs.readdirSync(inputDir)
    for (const image of images) {
      const filename = `${outputFileDir}/${image}`
      if (!fs.existsSync(filename) || force) {
        const resizedFile = await sharp(`${inputDir}/${image}`)
          .resize(520)
          .toBuffer()
        fs.writeFileSync(`${outputFileDir}/${image}`, resizedFile)
      }
    }
  }
}

module.exports = resizePrintfulMockups
