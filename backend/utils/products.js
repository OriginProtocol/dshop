const path = require('path')
const fs = require('fs')
const mv = require('mv')
const sharp = require('sharp')
const get = require('lodash/get')
const pick = require('lodash/pick')
const { execFile } = require('child_process')

const { getLogger } = require('../utils/logger')

const { DSHOP_CACHE } = require('./const')

const { addToCollections } = require('./collections')
const log = getLogger('utils.products')

const validProductFields = [
  'id',
  'title',
  'description',
  'price',
  'image',
  'images',
  'quantity',
  'sku',
  'variants',
  'options',
  'availableOptions'
]

const minimalistProductFields = ['id', 'title', 'description', 'price', 'image']

function generateUrlFriendlyId(title) {
  return title
    .replace(/[^a-z0-9 -]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

function getUniqueID(title, shop) {
  const rawId = generateUrlFriendlyId(title)

  const products = readProductsFile(shop)

  const existingProductIds = products.map((p) => p.id)

  // Blacklisting new keyword
  existingProductIds.push('new')

  if (!existingProductIds.includes(rawId)) return rawId

  let suffix = 1

  // eslint-disable-next-line no-constant-condition
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

// Appends to products.json and returns an id
function appendToProductsFile(shop, productData) {
  const allProducts = readProductsFile(shop)

  let existingIndex = allProducts.length

  if (productData.id) {
    existingIndex = allProducts.findIndex((p) => p.id === productData.id)
    if (existingIndex < 0) {
      // Should never happen, but just because
      existingIndex = allProducts.length
    }
  }

  allProducts[existingIndex] = pick(productData, minimalistProductFields)

  writeProductsFile(shop, allProducts)
}

function writeProductData(shop, productId, data) {
  const outDir = path.resolve(
    `${DSHOP_CACHE}/${shop.authToken}/data/${productId}`
  )
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const dataFilePath = `${outDir}/data.json`
  fs.writeFileSync(dataFilePath, JSON.stringify(data, undefined, 2))
}

async function removeProductData(shop, productId) {
  const outDir = path.resolve(
    `${DSHOP_CACHE}/${shop.authToken}/data/${productId}`
  )
  if (fs.existsSync(outDir)) {
    // fs.rmdirSync(outDir, { recursive: true })
    // TODO: How safe is this?
    await new Promise((resolve, reject) => {
      execFile('rm', ['-rf', outDir], (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }
}

async function moveProductImages(shop, productId, productData) {
  const dataDir = shop.authToken
  const tmpDir = path.resolve(`${DSHOP_CACHE}/${dataDir}/data/__tmp`)
  const targetDir = path.resolve(`${DSHOP_CACHE}/${dataDir}/data/${productId}`)

  const supportedSizes = [520, 'orig']

  const out = []
  const imageMap = new Map()
  for (const filePath of productData.images || []) {
    if (filePath.includes('/__tmp/')) {
      const fileName = filePath.split('/__tmp/', 2)[1]
      const tmpFilePath = `${tmpDir}/${fileName}`

      for (const supportedSize of supportedSizes) {
        const sizeDir = `${targetDir}/${supportedSize}`
        const targetPath = `${sizeDir}/${fileName}`

        if (!fs.existsSync(sizeDir)) {
          fs.mkdirSync(sizeDir, { recursive: true })
        }

        if (supportedSize === 'orig') {
          // Move from temp dir in case of original size
          await new Promise((resolve) => {
            mv(tmpFilePath, targetPath, (err) => {
              if (err) {
                // TODO: better error handling
                // Just push the original temp path for now
                log.error(`Couldn't move file`, tmpFilePath, targetPath, err)
              } else {
                out.push(fileName)
                imageMap.set(filePath, fileName)
              }
              resolve()
            })
          })
        } else {
          // resize otherwise
          const resizedImage = await sharp(tmpFilePath)
            .resize(supportedSize)
            .toBuffer()

          fs.writeFileSync(targetPath, resizedImage)
        }
      }
    } else {
      // Leave if it is already out of temp dir
      // Could be the case in case of updates
      out.push(filePath)
      imageMap.set(filePath, filePath)
    }
  }

  const variants = get(productData, 'variants', []).map((v) => {
    return { ...v, image: imageMap.get(v.image) || v.image }
  })

  return { images: out, variants }
}

async function upsertProduct(shop, productData) {
  if (productData.id) {
    const dataDir = path.resolve(
      `${DSHOP_CACHE}/${shop.authToken}/data/${productData.id}/data.json`
    )
    if (!fs.existsSync(dataDir)) {
      return {
        status: 404,
        error: 'No such product'
      }
    }
  }

  const newProductId = productData.id || getUniqueID(productData.title, shop)

  const { images: productImages, variants } = await moveProductImages(
    shop,
    newProductId,
    productData
  )

  const product = {
    ...pick(productData, validProductFields),
    id: newProductId,
    images: productImages,
    image: productImages[0],
    variants
  }

  if (!product.variants || !product.variants.length) {
    product.variants = [
      {
        ...pick(product, ['title', 'price', 'image']),
        id: 0,
        name: product.title,
        options: [],
        option1: null,
        option2: null,
        option3: null,
        available: true
      }
    ]
  }

  writeProductData(shop, newProductId, product)

  appendToProductsFile(shop, product)

  addToCollections(shop, newProductId, productData.collections)

  if (productData.collections) {
    addToCollections(shop, productData.id, productData.collections)
  }

  return {
    status: 200,
    error: null,
    product
  }
}

async function deleteProduct(shop, productId) {
  const allProducts = readProductsFile(shop)

  const existingIndex = allProducts.findIndex((p) => p.id === productId)

  if (existingIndex < 0) {
    return {
      status: 404,
      error: 'No such product'
    }
  }

  const [product] = allProducts.splice(existingIndex, 1)

  await removeProductData(shop, productId)
  writeProductsFile(shop, allProducts)

  return {
    status: 200,
    error: null,
    product
  }
}

module.exports = { upsertProduct, deleteProduct }
