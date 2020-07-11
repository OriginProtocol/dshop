const fs = require('fs')

const difference = require('lodash/difference')

const getProducts = require('./getProducts')
const getProduct = require('./getProduct')
const getProductIds = require('./getProductIds')

const PrintfulURL = 'https://api.printful.com'

/**
 * Downloads product data from Printful
 *
 * @param {String} OutputDir data directory of the shop
 * @param {String} printfulApi API key of printful store
 * @param {Boolean} smartFetch If set to true, only fetches products that have never been synced, if any.
 * @param {Array<Number|String>} forceRefetchIds [Used with smartFetch] Array of product IDs that have to be refetch, even if it already exists
 *
 * @returns {Array<Number|String>} IDs of products that were updated/refetched
 */
async function downloadProductData({
  OutputDir,
  printfulApi,
  smartFetch,
  forceRefetchIds
}) {
  const apiAuth = Buffer.from(printfulApi).toString('base64')

  fs.mkdirSync(`${OutputDir}/data-printful`, { recursive: true })

  // Keep track of new product IDs
  let existingProductIds = []
  if (smartFetch) {
    // Read existing IDs
    existingProductIds = await getProductIds({ OutputDir })
  }

  await getProducts({ PrintfulURL, apiAuth, OutputDir })

  let ids = await getProductIds({ OutputDir })
  if (smartFetch) {
    const overallLength = ids.length
    // Find product Ids that were previously missing
    ids = difference(ids, existingProductIds)

    // Append `forceRefetchIds` and then do deduplicate
    ids = Array.from(new Set([...ids, ...(forceRefetchIds || [])]))

    console.log(
      `Will be refetching only ${ids.length} out of ${overallLength} products`
    )
  }

  for (const id of ids) {
    await getProduct({ PrintfulURL, apiAuth, OutputDir, id })
  }

  return ids
}

module.exports = downloadProductData
