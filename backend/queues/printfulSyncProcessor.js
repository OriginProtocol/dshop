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

  const { OutputDir, apiKey, shopId } = job.data

  await downloadProductData({ OutputDir, printfulApi: apiKey })
  log(25, 'Downloaded products data')

  await writeProductData({ OutputDir })
  log(50, 'Wrote product data')

  await downloadPrintfulMockups({ OutputDir })
  log(75, 'Downloaded mockups')

  await resizePrintfulMockups({ OutputDir })
  log(90, 'Resize mockups')

  if (shopId) {
    const shop = await Shop.findOne({ where: { id: shopId } })
    shop.update({
      hasChanges: true
    })
  }

  log(100, 'Finished')
}

module.exports = { processor, attachToQueue }
