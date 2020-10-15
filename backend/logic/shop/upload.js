const formidable = require('formidable')
const fs = require('fs')
const path = require('path')

const { DSHOP_CACHE } = require('../../utils/const')
const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.shop.upload')

/**
 * Uploads images sent as raw data to shop's
 * data directory.
 *
 * @param {Request} req Express's request object
 * @param {String} targetPath The path inside shop's datadir to upload the files to
 *
 *
 */
module.exports = async (req, targetPath = '/') => {
  try {
    const dataDir = req.shop.authToken
    const uploadDir = path.resolve(
      path.join(`${DSHOP_CACHE}/${dataDir}/data`, targetPath)
    )

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir)
    }

    const form = formidable({
      multiples: true,
      uploadDir,
      keepExtensions: true
    })

    return new Promise((resolve) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          // next(err)
          log.error(err)
          resolve({
            status: 500,
            reason: 'Upload failed'
          })
        }

        const allFiles = Array.isArray(files.file) ? files.file : [files.file]

        resolve({
          status: 200,
          success: true,
          uploadedFiles: allFiles.map((file) => ({
            path: file.path.replace(
              uploadDir,
              path.join(`/${dataDir}`, targetPath)
            ),
            name: file.name
          }))
        })
      })
    })
  } catch (err) {
    log.error(err)
    return {
      status: 500,
      reason: 'Some unknown error occured'
    }
  }
}
