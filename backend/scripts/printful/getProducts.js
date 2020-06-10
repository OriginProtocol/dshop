const fs = require('fs')
const { get } = require('./_api')

async function getProducts({ apiAuth, OutputDir }) {
  const json = await get(`/sync/products?limit=100`, { auth: apiAuth })
  console.log(`${OutputDir}/printful-products.json`)

  // Filter out products with titles starting 'Disabled'
  const result = json.result.filter((r) => !r.name.match(/^disabled/i))

  fs.writeFileSync(
    `${OutputDir}/printful-products.json`,
    JSON.stringify(result, null, 2)
  )

  console.log(`Synced ${json.result.length} products from Printful`)

  return json.result.map((d) => d.id)
}

module.exports = getProducts
