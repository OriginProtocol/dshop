const queues = require('./queues')

const downloadProductData = require('../logic/printful/sync/downloadProductData')
const writeProductData = require('../logic/printful/sync/writeProductData')
const downloadPrintfulMockups = require('../logic/printful/sync/downloadPrintfulMockups')
const resizePrintfulMockups = require('../logic/printful/sync/resizePrintfulMockups')

const { Shop } = require('../models')

const attachToQueue = () => {
  const queue = queues['printfulSyncQueue']
  queue.process(processor)
  queue.resume() // Start if paused

  const updateSyncStatus = async (job, status, hasChanges) => {
    if (!job.data) return

    const { shopId } = job.data

    if (!shopId) return

    const data = { printfulSyncing: status }

    if (hasChanges !== undefined) {
      data.hasChanges = hasChanges
    }

    await Shop.update(data, { where: { id: shopId } })
  }

  queue.on('completed', (job) => {
    updateSyncStatus(job, false, true)
  })
  queue.on('failed', (job) => {
    updateSyncStatus(job, false)
  })

  queue.on('waiting', (job) => {
    updateSyncStatus(job, true)
  })
  queue.on('active', (job) => {
    updateSyncStatus(job, true)
  })
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

  log(
    100,
    `Finished, Cumulative time take: ${(Date.now() - startTime) / 1000}s`
  )
}

module.exports = { processor, attachToQueue }
