const fs = require('fs')
const { get } = require('./_api')

async function getProducts({ apiAuth, OutputDir }) {
  const limit = 10
  let offset = 0

  const allProducts = []

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const json = await get(`/sync/products?limit=${limit}&offset=${offset}`, {
      auth: apiAuth
    })

    console.log(`Pulling products from page ${offset / limit + 1}...`)

    // Filter out products with titles starting 'Disabled'
    const result = json.result.filter((r) => !r.name.match(/^disabled/i))

    allProducts.push(...result)

    const { total } = json.paging
    if (total <= offset + limit) {
      break
    } else {
      offset = offset + limit
    }
  }

  fs.writeFileSync(
    `${OutputDir}/printful-products.json`,
    JSON.stringify(allProducts, null, 2)
  )

  console.log(`Synced ${allProducts.length} products from Printful`)

  return allProducts.map((d) => d.id)
}

module.exports = getProducts
