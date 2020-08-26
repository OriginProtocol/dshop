const queues = require('./queues')

const downloadProductData = require('../scripts/printful/downloadProductData')
const writeProductData = require('../scripts/printful/writeProductData')
const downloadPrintfulMockups = require('../scripts/printful/downloadPrintfulMockups')
const resizePrintfulMockups = require('../scripts/printful/resizePrintfulMockups')

const { Shop } = require('../models')

const attachToQueue = () => {
  const queue = queues['printfulSyncQueue']
  queue.process(processor)
  queue.resume() // Start if paused
}

const processor = async (job) => {
  const log = (progress, str) => {
    job.log(str)
    job.progress(progress)
  }

  const startTime = Date.now()

  const {
    OutputDir,
    apiKey,
    shopId,
    smartFetch,
    forceRefetchIds,
    refreshImages
  } = job.data

  let taskStartTime = Date.now()
  const updatedIds = await downloadProductData({
    OutputDir,
    printfulApi: apiKey,
    smartFetch,
    forceRefetchIds
  })
  log(
    25,
    `Downloaded products data, Time Taken: ${
      (Date.now() - taskStartTime) / 1000
    }s`
  )
  taskStartTime = Date.now()

  await writeProductData({ OutputDir, updatedIds })
  log(
    50,
    `Wrote product data, Time Taken: ${(Date.now() - taskStartTime) / 1000}s`
  )
  taskStartTime = Date.now()

  await downloadPrintfulMockups({ OutputDir, force: refreshImages })
  log(
    75,
    `Downloaded mockups, Time Taken: ${(Date.now() - taskStartTime) / 1000}s`
  )
  taskStartTime = Date.now()

  await resizePrintfulMockups({ OutputDir, force: refreshImages })
  log(90, `Resize mockups, Time Taken: ${(Date.now() - taskStartTime) / 1000}s`)

  if (shopId) {
    const shop = await Shop.findOne({ where: { id: shopId } })
    shop.update({
      hasChanges: true
    })
  }

  log(
    100,
    `Finished, Cumulative time take: ${(Date.now() - startTime) / 1000}s`
  )
}

module.exports = { processor, attachToQueue }
