const { authSellerAndShop, authRole } = require('./_auth')
const { upsertProduct, deleteProduct } = require('../utils/products')

const uploadFiles = require('../logic/shop/upload')

module.exports = function (router) {
  router.post(
    '/products',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { product, status, error } = await upsertProduct(req.shop, req.body)

      if (!error) {
        await req.shop.update({
          hasChanges: true
        })
      }

      return res.status(status).send({
        success: !error,
        reason: error,
        product
      })
    }
  )

  router.delete(
    '/products/:productId',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { product, status, error } = await deleteProduct(
        req.shop,
        req.params.productId
      )

      if (!error) {
        await req.shop.update({
          hasChanges: true
        })
      }

      return res.status(status).send({
        success: !error,
        reason: error,
        product
      })
    }
  )

  router.post(
    '/products/upload-images',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { status, ...data } = await uploadFiles(req, '/__tmp')
      res.status(status).send(data)
    }
  )
}
