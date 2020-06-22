const fetch = require('node-fetch')
const { getLogger } = require('../utils/logger')

const log = getLogger('utils.discordWebhook')

module.exports = function ({ url, shopName, orderId, total, items = [] }) {
  if (!url) {
    log.warn('Discord webhook URL not configured. Skipping.')
    return
  }

  const allItems = items.join(', ')
  const content = `Order #${orderId} on '${shopName}' for ${total}: ${allItems}`
  log.info(`Discord webhook: ${content}`)
  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Discord webhook not called.')
    return
  }
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
    .then((res) => {
      log.info(`Discord webhook OK: ${res.ok}`)
    })
    .catch((err) => {
      log.error('Discord webhook err:', err)
    })
}
