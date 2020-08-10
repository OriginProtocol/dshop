const mjml2html = require('mjml')
const { Shop, Network } = require('../../models')

const { getShopTransport } = require('./_getTransport')
const { getLogger } = require('../../utils/logger')

const head = require('./templates/_head')
const stripeWebhookError = require('./templates/stripeWebhookError')
const stripeWebhookErrorTxt = require('./templates/stripeWebhookErrorTxt')

const log = getLogger('utils.emailer')

async function stripeWebhookErrorEmail(shopId, errorData, skip) {
  const shop = await Shop.findOne({ where: { id: shopId } })
  const network = await Network.findOne({ where: { active: true } })
  const { transporter, from, replyTo } = await getShopTransport(shop, network)
  if (!transporter) {
    log.info(`No email transport configured. Skiped sending new order email.`)
    return
  }

  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  const vars = {
    head,
    supportEmail: replyTo || from,
    siteName: shop.name,
    fromEmail: from,
    ...errorData
  }

  const htmlOutput = mjml2html(stripeWebhookError(vars), { minify: true })
  const txtOutput = stripeWebhookErrorTxt(vars)

  const message = {
    from,
    to: replyTo || from,
    subject: 'Failed to process stripe webhook event',
    html: htmlOutput.html,
    text: txtOutput,
    replyTo
  }

  if (skip) return message

  return new Promise((resolve) => {
    transporter.sendMail(message, (err, msg) => {
      if (err) {
        log.error('Error sending email', err)
      } else {
        log.info(
          `Stripe webhook error email sent, from ${message.from} to ${message.to}`
        )
        log.debug(msg.envelope)
      }

      resolve(message)
    })
  })
}

module.exports = stripeWebhookErrorEmail
