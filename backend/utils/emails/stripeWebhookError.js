const mjml2html = require('mjml')
const { Shop } = require('../../models')

const getEmailTransporterAndConfig = require('./_getTransport')
const { getLogger } = require('../../utils/logger')

const head = require('./templates/head')
const stripeWebhookError = require('./templates/stripeWebhookError')
const stripeWebhookErrorTxt = require('./templates/stripeWebhookErrorTxt')

const log = getLogger('utils.emailer')

async function stripeWebhookErrorEmail(shopId, errorData, skip) {
  const shop = await Shop.findOne({ where: { id: shopId } })
  const {
    transporter,
    fromEmail,
    supportEmail,
    configJson: data,
    replyTo,
    storeEmail
  } = await getEmailTransporterAndConfig(shop)
  if (!transporter) {
    log.info(
      `Emailer not configured for shop id ${shopId}. Skipping sending Stripe error email.`
    )
    return
  }

  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  const vars = {
    head,
    supportEmail,
    siteName: data.fullTitle || data.title,
    fromEmail,
    ...errorData
  }

  const htmlOutput = mjml2html(stripeWebhookError(vars), { minify: true })
  const txtOutput = stripeWebhookErrorTxt(vars)

  const message = {
    from: fromEmail,
    to: storeEmail,
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