const fs = require('fs')
const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

function getOldData(body) {
  const dataMatch = body.match(/sizeGuideTablePar.data = (.*);/)
  const sizesMatch = body.match(/sizeGuideTablePar.productSizes = (.*);/)
  const [, dataRaw] = dataMatch
  const [, productSizesRaw] = sizesMatch

  const data = JSON.parse(dataRaw)
  const productSizes = JSON.parse(productSizesRaw)
  return { data, productSizes }
}

function getNewData(body) {
  const dataMatch = body.match(/pmSizeTableParams.data = (.*);/)
  const sizesMatch = body.match(/mySizeTableParams.productSizes = (.*);/)
  const [, dataRaw] = dataMatch
  const [, productSizesRaw] = sizesMatch

  const data = JSON.parse(dataRaw)
  const productSizes = JSON.parse(productSizesRaw)
  return { data, productSizes }
}

async function getSizeGuide({ OutputDir, productId }) {
  const sizePath = `${OutputDir}/data-printful/size-guide-${productId}.json`

  if (fs.existsSync(sizePath)) {
    const resultRaw = fs.readFileSync(sizePath)
    const result = JSON.parse(resultRaw)
    return result
  }

  try {
    const url = 'https://www.printful.com/custom-products/size-guide'
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(`${url}?productId=${productId}`)
    const body = await page.content()
    await browser.close()

    const isOld = body.match(/sizeGuideTablePar.isOldSizeGuide = true;/)
    const { data, productSizes } = isOld ? getOldData(body) : getNewData(body)

    const measurements = Object.keys(data).map((key) => ({
      name: key,
      type: productId === 186 ? '' : data[key].type // Exclude socks
    }))
    const sizes = productSizes.map((size) => {
      const values = measurements.reduce((m, key) => {
        m[key.name] = data[key.name].values[size].join(' - ')
        return m
      }, {})
      return { size, ...values }
    })

    const result = { sizes, measurements }

    fs.writeFileSync(sizePath, JSON.stringify(result, null, 2))
    return result
  } catch (e) {
    console.log(`Error fetching size guide for product ${productId}`)
    console.error(e)
    return null
  }
}

module.exports = getSizeGuide
