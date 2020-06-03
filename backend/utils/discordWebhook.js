const fetch = require('node-fetch')

module.exports = function ({ url, shopName, orderId, total, items = [] }) {
  if (!url) {
    console.log('Discord webhook URL not configured. Skipping.')
    return
  }

  const allItems = items.join(', ')
  const content = `Order #${orderId} on '${shopName}' for ${total}: ${allItems}`
  console.log(`Discord webhook: ${content}`)
  if (process.env.NODE_ENV === 'test') {
    console.log('Test environment. Discord webhook not called.')
    return
  }
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
    .then((res) => {
      console.log(`Discord webhook OK: ${res.ok}`)
    })
    .catch((err) => {
      console.log('Discord webhook err:', err)
    })
}
