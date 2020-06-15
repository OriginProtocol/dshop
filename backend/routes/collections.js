const fs = require('fs')
const path = require('path')

const { authSellerAndShop, authRole } = require('./_auth')
const { DSHOP_CACHE } = require('../utils/const')

module.exports = function (app) {
  app.put(
    '/collections',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const collections = req.body.collections

      try {
        const outDir = path.resolve(`${DSHOP_CACHE}/${req.shop.authToken}/data`)
        const collectionsPath = `${outDir}/collections.json`
        fs.writeFileSync(
          collectionsPath,
          JSON.stringify(collections, undefined, 2)
        )
        res.send({ success: true })
      } catch (e) {
        res.json({ success: false })
      }
    }
  )
}
