const mjml2html = require('mjml')
const { Shop } = require('../../models')

const getEmailTransporterAndConfig = require('./_getTransport')
const { getLogger } = require('../../utils/logger')

const head = require('./templates/head')
const printfulOrderFailed = require('./templates/printfulOrderFailed')
const printfulOrderFailedTxt = require('./templates/printfulOrderFailedTxt')

const log = getLogger('utils.emailer')

async function sendPrintfulOrderFailedEmail(shopId, orderData, opts, skip) {
  const shop = await Shop.findOne({ where: { id: shopId } })
  const {
    transporter,
    fromEmail,
    supportEmail,
    shopConfig: config,
    configJson: data,
    replyTo,
    storeEmail
  } = await getEmailTransporterAndConfig(shop)
  if (!transporter) {
    log.info(
      `Emailer not configured for shop id ${shopId}. Skipping sending Printful order failed email.`
    )
    return
  }

  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  const publicURL = config.publicUrl

  const cart = orderData.data

  const vars = {
    head,
    supportEmail,
    message: opts ? opts.message : '',
    orderUrlAdmin: `${publicURL}/admin/orders/${cart.offerId}`,
    siteName: data.fullTitle || data.title,
    fromEmail
  }

  const htmlOutput = mjml2html(printfulOrderFailed(vars), { minify: true })
  const txtOutput = printfulOrderFailedTxt(vars)

  const message = {
    from: fromEmail,
    to: storeEmail,
    subject: 'Failed to create order on Printful',
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
          `Printful Order fulfilment failed email sent, from ${message.from} to ${message.to}`
        )
        log.debug(msg.envelope)
      }

      resolve(message)
    })
  })
}

module.exports = sendPrintfulOrderFailedEmail