const fs = require('fs')
const sharp = require('sharp')
const https = require('https')
const { getLogger } = require('../../utils/logger')

const log = getLogger('scripts.printful.downloadPrintfulMockups')

async function downloadPrintfulMockups({ OutputDir, png, force }) {
  const filesRaw = fs.readFileSync(`${OutputDir}/printful-images.json`)
  const files = JSON.parse(filesRaw).filter((f) => !f.skip)
  const forceMsg = force ? ' (force new images)' : ''
  log.info(`Downloading ${files.length} mockups${forceMsg}...`)

  for (const file of files) {
    const prefix = `${OutputDir}/data/${file.id}/orig`
    fs.mkdirSync(prefix, { recursive: true })
    const filename = `${prefix}/${file.file}`
    const filenameOut = png ? filename : filename.replace('.png', '.jpg')
    // log.debug(filenameOut)
    if (!fs.existsSync(filenameOut) || force) {
      await new Promise((resolve) => {
        const f = fs.createWriteStream(filename).on('finish', resolve)
        https.get(file.url, (response) => response.pipe(f))
      })
      let resizedFile
      if (png) {
        resizedFile = await sharp(filename)
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .toBuffer()
        fs.writeFileSync(filenameOut, resizedFile)
      } else {
        resizedFile = await sharp(filename)
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .jpeg()
          .toBuffer()
        fs.writeFileSync(filenameOut, resizedFile)
        fs.unlinkSync(filename)
      }
    }
  }
}

module.exports = downloadPrintfulMockups
