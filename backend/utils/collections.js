const fs = require('fs')
const path = require('path')

const { DSHOP_CACHE } = require('./const')

const addToCollections = (shop, productId, collectionIds) => {
  try {
    const outDir = path.resolve(`${DSHOP_CACHE}/${shop.authToken}/data`)
    const collectionsPath = `${outDir}/collections.json`
    const data = JSON.parse(fs.readFileSync(collectionsPath).toString())

    const updatedData = data.map((collection) => {
      let products = collection.products || []

      const hasProduct = collection.products.indexOf(productId) >= 0
      const shouldHaveProduct = collectionIds.indexOf(collection.id) >= 0

      if (hasProduct && !shouldHaveProduct) {
        products = products.filter((pId) => pId !== productId)
      } else if (!hasProduct && shouldHaveProduct) {
        products.push(productId)
      }

      return { ...collection, products }
    })

    fs.writeFileSync(collectionsPath, JSON.stringify(updatedData, undefined, 2))

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

module.exports = {
  addToCollections
}
