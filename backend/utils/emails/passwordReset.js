const mjml2html = require('mjml')

const getEmailTransporterAndConfig = require('./_getTransport')
const { getLogger } = require('../../utils/logger')

const head = require('./templates/head')
const forgotPassEmail = require('./templates/forgotPassEmail')
const forgotPassEmailTxt = require('./templates/forgotPassEmailTxt')

const log = getLogger('utils.emailer')

async function sendPasswordResetEmail(seller, verifyUrl, skip) {
  const {
    transporter,
    fromEmail,
    replyTo,
    supportEmail
  } = await getEmailTransporterAndConfig()
  if (!transporter) {
    log.info(`Emailer not configured. Skipping sending verification email.`)
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

  const htmlOutput = mjml2html(forgotPassEmail(vars), { minify: true })
  const txtOutput = forgotPassEmailTxt(vars)

  const message = {
    from: fromEmail,
    to: `${name} <${email}>`,
    subject: 'Reset your password',
    html: htmlOutput.html,
    text: txtOutput,
    replyTo
  }

  if (skip) return message

  return new Promise((resolve) => {
    transporter.sendMail(message, (err, msg) => {
      if (err) {
        log.error('Error sending forgot password email', err)
        return resolve()
      } else {
        log.info(
          `Forgot password email sent, from ${message.from} to ${message.to}`
        )
        log.debug(msg.envelope)
      }

      resolve(message)
    })
  })
}

module.exports = sendPasswordResetEmail