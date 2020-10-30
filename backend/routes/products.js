const { authSellerAndShop, authRole, authShop } = require('./_auth')
const { upsertProduct, deleteProduct } = require('../logic/products')

const { Product } = require('../models')

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
      const { status, ...data } = await uploadFiles(req, '/__tmp', true)
      res.status(status).send(data)
    }
  )

  /**
   * Returns the stock info of all
   * products of the shop
   */
  router.get('/products/stock', authShop, async (req, res) => {
    const products = await Product.findAll({
      where: {
        shopId: req.shop.id
      }
    })

    res.status(200).send({
      success: true,
      products
    })
  })

  /**
   * Returns the stock info of a single product
   *
   * @param productId the ID of the product as in products.json
   */
  router.get('/products/:productId/stock', authShop, async (req, res) => {
    const product = await Product.findOne({
      where: {
        productId: req.params.productId,
        shopId: req.shop.id
      }
    })

    if (!product) {
      return res.status(200).send({
        reason: 'No stock info found for the productId'
      })
    }

    res.status(200).send({
      success: true,
      product
    })
  })
}
