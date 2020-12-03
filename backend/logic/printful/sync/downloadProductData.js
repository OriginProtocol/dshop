const fs = require('fs')

const difference = require('lodash/difference')

const getProducts = require('../../../scripts/printful/getProducts')
const getProduct = require('../../../scripts/printful/getProduct')
const getProductIds = require('../../../scripts/printful/getProductIds')

const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.printful.downloadPrintfulMockups')

const PrintfulURL = 'https://api.printful.com'

/**
 * Downloads product data from Printful.
 * Sleeps for 60s every 75 products fetched since Printful has
 * a rate-limit of 120 rpm (using 75 instead of 120 to take into
 * account the multiple calls made before this functions).
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

    log.debug(
      `Will be refetching only ${ids.length} out of ${overallLength} products`
    )
  }

  let index = 1
  for (const id of ids) {
    await getProduct({ PrintfulURL, apiAuth, OutputDir, id })
    if (index % 75 === 0) {
      // Wait out rate limit
      log.info('Sleeping for 60s to avoid hitting rate-limits...')
      await new Promise((r) => setTimeout(r, 60000))
    }
    index++
  }

  return ids
}

module.exports = downloadProductData
