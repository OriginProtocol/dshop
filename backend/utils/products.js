const path = require('path')
const fs = require('fs')

const pick = require('lodash/pick')
const { DSHOP_CACHE } = require('./const')

const validProductFields = [
  'title',
  'price',
  'image',
  'gallery',
  'quantity',
  'sku',
  'description',
  'variants',
]

function generateUrlFriendlyId(title) {
  return title.replace(/[^a-z0-9 -]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

function getUniqueID(title, products) {
  const rawId = generateUrlFriendlyId(title)

  const existingProductIds = products.map(p => p.id)

  if (!existingProductIds.includes(rawId)) return rawId

  let suffix = 1

  while (true) {
    const fullID = `${rawId}-${suffix}`

    if (!existingProductIds.includes(fullID)) {
      return fullID
    }

    suffix++
  }
}

function readProductsFile(shop) {
  const outDir = path.resolve(`${DSHOP_CACHE}/${shop.authToken}/data`)
  const productsPath = `${outDir}/products.json`
  return require(productsPath)
}

function writeProductsFile(shop, data) {
  const outDir = path.resolve(`${DSHOP_CACHE}/${shop.authToken}/data`)
  const productsPath = `${outDir}/products.json`
  fs.writeFileSync(productsPath, JSON.stringify(data, undefined, 2))
}

async function upsertProduct(shop, productData) {
  const allProducts = readProductsFile(shop)

  let existingIndex = allProducts.length

  if (productData.id) {
    existingIndex = allProducts.findIndex(p => p.id === productData.id)
    if (existingIndex < 0) {
      return {
        status: 404,
        error: 'No such product'
      }
    }
  }

  const newProductId = productData.id || getUniqueID(productData.title, allProducts)

  const product = {
    ...pick(productData, validProductFields),
    id: newProductId
  }

  allProducts[existingIndex] = product

  writeProductsFile(shop, allProducts)

  return {
    status: 200,
    error: null,
    product
  }
}

async function deleteProduct(shop, productId) {
  const allProducts = readProductsFile(shop)

  const existingIndex = allProducts.findIndex(p => p.id === productId)

  if (existingIndex < 0) {
    return {
      status: 404,
      error: 'No such product'
    }
  }

  const [product] = allProducts.splice(existingIndex, 1)

  writeProductsFile(shop, allProducts)

  return {
    status: 200,
    error: null,
    product
  }

}

module.exports = { upsertProduct, deleteProduct }