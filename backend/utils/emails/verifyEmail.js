const mjml2html = require('mjml')
const { Shop } = require('../../models')

const getEmailTransporterAndConfig = require('./_getTransport')
const { getLogger } = require('../../utils/logger')

const head = require('./templates/head')
const verifyEmail = require('./templates/verifyEmail')
const verifyEmailTxt = require('./templates/verifyEmailTxt')

const log = getLogger('utils.emailer')

async function sendVerifyEmail(seller, verifyUrl, shopId, skip) {
  const shop = await Shop.findOne({ where: { id: shopId } })
  const {
    transporter,
    fromEmail,
    replyTo,
    supportEmail
  } = await getEmailTransporterAndConfig(shop)
  if (!transporter) {
    log.info(
      `Emailer not configured for shop id ${shopId}. Skipping sending verification email.`
    )
    return
  }

  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  const { name, email } = seller

  const vars = {
    head,
    name,
    verifyUrl,
    supportEmailPlain: supportEmail,
    fromEmail
  }

  const htmlOutput = mjml2html(verifyEmail(vars), { minify: true })

  const txtOutput = verifyEmailTxt(vars)

  const message = {
    from: fromEmail,
    to: `${name} <${email}>`,
    subject: 'Confirm your email address',
    html: htmlOutput.html,
    text: txtOutput,
    replyTo
  }

  if (skip) return message

  return new Promise((resolve) => {
    transporter.sendMail(message, (err, msg) => {
      if (err) {
        log.error('Error sending verification email', err)
        return resolve()
      } else {
        log.info(
          `Verification email sent, from ${message.from} to ${message.to}`
        )
        log.debug(msg.envelope)
      }

      resolve(message)
    })
  })
}

module.exports = sendVerifyEmail