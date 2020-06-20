const fs = require('fs')
const path = require('path')

const { DSHOP_CACHE } = require('./const')

const addToCollections = (shop, productId, collectionIds) => {
  try {
    const outDir = path.resolve(`${DSHOP_CACHE}/${shop.authToken}/data`)
    const collectionsPath = `${outDir}/collections.json`
    const data = require(collectionsPath)

    const updatedData = data.map((collection) => {
      if (collectionIds.includes(collection.id)) {
        return {
          ...collection,
          products: Array.from(new Set([...collection.products, productId]))
        }
      }

      return collection
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
