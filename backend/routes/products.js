const formidable = require('formidable')
const fs = require('fs')
const path = require('path')

const { authSellerAndShop, authRole } = require('./_auth')
const { upsertProduct, deleteProduct } = require('../utils/products')
const { DSHOP_CACHE } = require('../utils/const')
const { getLogger } = require('../utils/logger')

const log = getLogger('routes.products')

module.exports = function (app) {
  app.post(
    '/products',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { product, status, error } = await upsertProduct(req.shop, req.body)

      return res.status(status).send({
        success: !error,
        reason: error,
        product
      })
    }
  )

  app.delete(
    '/products/:productId',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { product, status, error } = await deleteProduct(
        req.shop,
        req.params.productId
      )

      return res.status(status).send({
        success: !error,
        reason: error,
        product
      })
    }
  )

  app.post(
    '/products/upload-images',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      try {
        const dataDir = req.shop.authToken
        const uploadDir = path.resolve(`${DSHOP_CACHE}/${dataDir}/data/__tmp`)

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir)
        }

        const form = formidable({
          multiples: true,
          uploadDir,
          keepExtensions: true
        })

        form.parse(req, async (err, fields, files) => {
          if (err) {
            // next(err)
            log.error(err)
            return res.status(500).send({
              reason: 'Upload failed'
            })
          }

          const allFiles = Array.isArray(files.file) ? files.file : [files.file]

          res.status(200).send({
            success: true,
            uploadedFiles: allFiles.map((file) => ({
              path: file.path.replace(uploadDir, `/${dataDir}/__tmp`),
              name: file.name
            }))
          })
        })
      } catch (err) {
        log.error(err)
        res.status(500).send({
          reason: 'Some unknown error occured'
        })
      }
    }
  )
}
