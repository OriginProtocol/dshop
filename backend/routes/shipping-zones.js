const fs = require('fs')
const path = require('path')

const { authSellerAndShop, authRole } = require('./_auth')
const { DSHOP_CACHE } = require('../utils/const')
const { setConfig, getConfig } = require('../utils/encryptedConfig')

module.exports = function (router) {
  router.put(
    '/shipping-zones',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { destinations, shippingFrom, processingTime } = req.body

      try {
        const outDir = path.resolve(`${DSHOP_CACHE}/${req.shop.authToken}/data`)
        const shippingPath = `${outDir}/shipping.json`
        fs.writeFileSync(
          shippingPath,
          JSON.stringify(destinations, undefined, 2)
        )

        const newConfig = setConfig(
          {
            ...getConfig(req.shop.config),
            shippingFrom,
            processingTime
          },
          req.shop.config
        )

        await req.shop.update({
          hasChanges: true,
          config: newConfig
        })

        res.send({ success: true })
      } catch (e) {
        res.json({ success: false })
      }
    }
  )
}
