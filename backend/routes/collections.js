const fetch = require('node-fetch')
const fs = require('fs')
const writeFileSync = require('write-file-atomic').sync
const path = require('path')
const pick = require('lodash/pick')

const { authSellerAndShop, authRole } = require('./_auth')
const { DSHOP_CACHE } = require('../utils/const')
const encConf = require('../utils/encryptedConfig')
const { findShopByHostname } = require('../utils/shop')

module.exports = function (router) {
  router.put(
    '/collections',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const collections = req.body.collections

      try {
        const outDir = path.resolve(`${DSHOP_CACHE}/${req.shop.authToken}/data`)
        const collectionsPath = `${outDir}/collections.json`
        writeFileSync(
          collectionsPath,
          JSON.stringify(collections, undefined, 2)
        )

        await req.shop.update({ hasChanges: true })

        res.send({ success: true })
      } catch (e) {
        res.json({ success: false })
      }
    }
  )

  router.put(
    '/collections/:collectionId',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { collectionId } = req.params

      try {
        const outDir = path.resolve(`${DSHOP_CACHE}/${req.shop.authToken}/data`)
        const collectionsPath = `${outDir}/collections.json`
        const collections = JSON.parse(fs.readFileSync(collectionsPath)).map(
          (collection) => {
            if (collection.id === collectionId) {
              return {
                ...collection,
                ...pick(req.body, ['title', 'products'])
              }
            }

            return collection
          }
        )

        writeFileSync(
          collectionsPath,
          JSON.stringify(collections, undefined, 2)
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

  router.get(
    '(/collections/:collection)?/products/:product',
    findShopByHostname,
    async (req, res) => {
      if (!res.shop) {
        return res.send('')
      }
      let html
      try {
        html = fs.readFileSync(`${__dirname}/public/index.html`).toString()
      } catch (e) {
        return res.send('')
      }

      const dataUrl = await encConf.get(req.shop.id, 'dataUrl')

      const url = `${dataUrl}${req.params.product}/data.json`
      const dataRaw = await fetch(url)

      if (dataRaw.ok) {
        const data = await dataRaw.json()
        let modifiedHtml = html
        if (data.title) {
          modifiedHtml = modifiedHtml.replace(
            /<title>.*<\/title>/,
            `<title>${data.title}</title>`
          )
        }
        if (data.head) {
          modifiedHtml = modifiedHtml
            .replace('</head>', data.head.join('\n') + '\n</head>')
            .replace('DATA_URL', dataUrl)
        }
        res.send(modifiedHtml)
      } else {
        res.send(html)
      }
    }
  )
}
