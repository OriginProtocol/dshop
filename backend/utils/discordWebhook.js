const fetch = require('node-fetch')
const { getLogger } = require('../utils/logger')
const { Network } = require('../models')
const { decryptConfig } = require('./encryptedConfig')

const log = getLogger('utils.discordWebhook')

const postToDiscord = (url, payload) => {
  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Discord webhook not called.')
    return
  }

  if (!url) {
    log.warn('Discord webhook URL not configured. Skipping.')
    return
  }

  log.debug(`Discord webhook: ${payload}`)

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then((res) => {
      log.debug(`Discord webhook OK: ${res.ok}`)
    })
    .catch((err) => {
      log.error('Discord webhook err:', err)
    })
}

const postNewOrderMessage = async ({
  url,
  shopName,
  orderId,
  total,
  items = []
}) => {
  return postToDiscord(url, {
    embeds: [
      {
        title: `Order #${orderId} on '${shopName}'`,
        description: [
          items.length > 1
            ? `**Items**:\n${items.map((item) => ` - ${item}`).join('\n')}`
            : `**Item**: ${items[0]}`,
          `**Total**: ${total}`
        ].join('\n'),
        color: '5345886'
      }
    ]
  })
}

const postQueueError = async ({
  queueName,
  errorMessage,
  jobId,
  shopId,
  attempts,
  stackTrace
}) => {
  const network = await Network.findOne({ where: { active: true } })

  if (!network) {
    log.error('No active network')
    return
  }
  const networkConfig = decryptConfig(network.config)
  const webhookUrl = networkConfig.discordWebhook

  return postToDiscord(webhookUrl, {
    embeds: [
      {
        title: `Job failure in ${queueName} queue`,
        description: [
          `**Job ID**: ${jobId}`,
          `**Shop ID**: ${shopId}`,
          `**Attempts**: ${attempts}`,
          `**Error**: ${errorMessage}`,
          `**Stack Trace**: \n${stackTrace}`
        ].join('\n'),
        color: '16739146'
      }
    ]
  })
}

module.exports = {
  postNewOrderMessage,
  postQueueError
}
