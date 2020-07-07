const fs = require('fs')
const path = require('path')
const pick = require('lodash/pick')
const snakeCase = require('lodash/snakeCase')

const { authSellerAndShop, authRole } = require('./_auth')
const { DSHOP_CACHE } = require('../utils/const')

module.exports = function (app) {
  app.put(
    '/shipping-zones',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { shippingZones } = req.body

      try {
        const newData = shippingZones.map((zone) => ({
          ...zone,
          id: zone.id || snakeCase(zone.label)
        }))

        const outDir = path.resolve(`${DSHOP_CACHE}/${req.shop.authToken}/data`)
        const shippingPath = `${outDir}/shipping.json`
        fs.writeFileSync(shippingPath, JSON.stringify(newData, undefined, 2))

        await req.shop.update({
          hasChanges: true
        })

        res.send({ success: true })
      } catch (e) {
        res.json({ success: false })
      }
    }
  )

  app.put(
    '/shipping-zones/:shippingId',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { shippingId } = req.params

      try {
        const outDir = path.resolve(`${DSHOP_CACHE}/${req.shop.authToken}/data`)
        const shippingPath = `${outDir}/shipping.json`
        const existingData = JSON.parse(fs.readFileSync(shippingPath))

        const newZoneData = {
          ...pick(req.body, ['label', 'detail', 'countries', 'amount', 'processingTime']),
          id: shippingId
        }

        let existingZone = false
        const shippingZones = existingData.map((zone) => {
          if (zone.id === shippingId) {
            existingZone = true
            return newZoneData
          }

          return zone
        })

        if (!existingZone) {
          shippingZones.push(newZoneData)
        }

        fs.writeFileSync(
          shippingPath,
          JSON.stringify(shippingZones, undefined, 2)
        )

        await req.shop.update({
          hasChanges: true
        })

        res.send({ success: true })
      } catch (e) {
        res.json({ success: false })
      }
    }
  )
}
