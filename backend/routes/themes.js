const { getAvailableThemes } = require('../logic/themes')
const { authRole, authSellerAndShop } = require('./_auth')
const uploadFiles = require('../logic/shop/upload')

module.exports = function (router) {
  /**
   * Returns a list of available themes,
   * Requires a server restart to pick up changes
   */
  router.get('/themes', (req, res) => {
    res.json({
      success: true,
      data: getAvailableThemes()
    })
  })

  router.post(
    '/themes/upload-images',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { status, ...data } = await uploadFiles(req, '/uploads')
      res.status(status).send(data)
    }
  )
}
