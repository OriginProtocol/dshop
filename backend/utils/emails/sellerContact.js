const mjml2html = require('mjml')

const { getNetworkTransport } = require('./_getTransport')
const { getLogger } = require('../logger')

const head = require('./templates/_head')
const sellerContact = require('./templates/sellerContact')
const sellerContactTxt = require('./templates/sellerContactTxt')

const log = getLogger('utils.emailer')

async function sellerContactEmail({ network, seller, data, skip }) {
  const { transporter, from } = await getNetworkTransport(network)
  if (!transporter) {
    log.info(`Emailer not configured. Skipping sending email.`)
    return
  }

  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  const { name, email } = seller

  const { subject, content, firstName, lastName, userEmail } = data

  const vars = {
    head,
    sellerName: seller.name,
    fullName: `${firstName || ''} ${lastName || ''}`,
    userEmail,
    subject: subject.replace(/<\/?[a-z0-9-:]+>/gi, ''),
    content: content.replace(/<\/?[a-z0-9-:]+>/gi, ''),
    fromEmail: from
  }

  const htmlOutput = mjml2html(sellerContact(vars))
  const txtOutput = sellerContactTxt(vars)

  const message = {
    from,
    to: `${name} <${email}>`,
    subject: 'Reset your password',
    replyTo: userEmail,
    html: htmlOutput,
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

module.exports = sellerContactEmail
