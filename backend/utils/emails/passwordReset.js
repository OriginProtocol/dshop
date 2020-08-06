const mjml2html = require('mjml')

const { getNetworkTransport } = require('./_getTransport')
const { getLogger } = require('../../utils/logger')

const head = require('./templates/_head')
const forgotPassEmail = require('./templates/forgotPassEmail')
const forgotPassEmailTxt = require('./templates/forgotPassEmailTxt')

const log = getLogger('utils.emailer')

async function sendPasswordResetEmail({ network, seller, verifyUrl, skip }) {
  const { transporter, from } = await getNetworkTransport(network)
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
    fromEmail: from
  }

  const htmlOutput = mjml2html(forgotPassEmail(vars), { minify: true })
  const txtOutput = forgotPassEmailTxt(vars)

  const message = {
    from,
    to: `${name} <${email}>`,
    subject: 'Reset your password',
    html: htmlOutput.html,
    text: txtOutput
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
