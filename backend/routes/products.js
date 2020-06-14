const { authSellerAndShop, authRole } = require('./_auth')
const { upsertProduct, deleteProduct } = require('../utils/products')

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
      const { product, status, error } = await deleteProduct(req.shop, req.params.productId)

      return res.status(status).send({
        success: !error,
        reason: error,
        product
      })
    }
  )

}
