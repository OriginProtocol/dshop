const mjml2html = require('mjml')
const { Network, Shop } = require('../../models')

const { getShopTransport } = require('./_getTransport')
const encConf = require('../../utils/encryptedConfig')
const { getLogger } = require('../../utils/logger')

const head = require('./templates/_head')
const printfulOrderFailed = require('./templates/printfulOrderFailed')
const printfulOrderFailedTxt = require('./templates/printfulOrderFailedTxt')

const log = getLogger('utils.emailer')

async function sendPrintfulOrderFailedEmail(shopId, orderData, opts, skip) {
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

  const shopConfig = encConf.getConfig(shop.config)
  const publicURL = `${shopConfig.publicUrl}/#`

  const cart = orderData.data

  const vars = {
    head,
    supportEmail: replyTo || from,
    message: opts ? opts.message : '',
    orderUrlAdmin: `${publicURL}/admin/orders/${cart.offerId}`,
    siteName: shop.name,
    fromEmail: from
  }

  const htmlOutput = mjml2html(printfulOrderFailed(vars), { minify: true })
  const txtOutput = printfulOrderFailedTxt(vars)

  const message = {
    from,
    to: replyTo || from,
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
