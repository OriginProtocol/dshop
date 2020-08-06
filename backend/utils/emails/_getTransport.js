const nodemailer = require('nodemailer')
const aws = require('aws-sdk')
// const { IS_TEST } = require('../const')
const encConf = require('../encryptedConfig')

function getTransportFromConfig(config) {
  // if (IS_TEST) {
  //   return { sendMail: (message, cb) => cb(null, message) }
  // }

  if (config.email === 'sendgrid') {
    const auth = config.sendgridApiKey
      ? { user: 'apikey', pass: config.sendgridApiKey }
      : { user: config.sendgridUsername, pass: config.sendgridPassword }
    const host = 'smtp.sendgrid.net'
    return nodemailer.createTransport({ host, port: 587, auth })
  } else if (config.email === 'mailgun') {
    return nodemailer.createTransport({
      host: config.mailgunSmtpServer,
      port: config.mailgunSmtpPort,
      auth: {
        user: config.mailgunSmtpLogin,
        pass: config.mailgunSmtpPassword
      }
    })
  } else if (config.email === 'aws') {
    const SES = new aws.SES({
      apiVersion: '2010-12-01',
      region: config.awsRegion,
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsAccessSecret
    })
    return nodemailer.createTransport({ SES })
  }
}

function getNetworkTransport(network) {
  const netConfig = encConf.getConfig(network.config)
  const transporter = getTransportFromConfig(netConfig.fallbackShopConfig)
  const displayName = netConfig.notificationEmailDisplayName
  const emailAddress = netConfig.notificationEmail
  return {
    from: displayName ? `${displayName} <${emailAddress}>` : emailAddress,
    transporter
  }
}

function getShopTransport(shop, network) {
  const shopConfig = encConf.getConfig(shop.config)
  const shopTransport = getTransportFromConfig(shopConfig)

  const netConfig = encConf.getConfig(network.config)
  const netTransport = getTransportFromConfig(netConfig.fallbackShopConfig)
  const netEmailAddress = netConfig.notificationEmail

  const displayName = shop.name
  const emailAddress = shopConfig.supportEmail || netEmailAddress
  if (shopTransport) {
    return {
      from: `${displayName} <${emailAddress}>`,
      transporter: shopTransport
    }
  }

  return {
    from: `${displayName} <${netEmailAddress}>`,
    transporter: netTransport,
    replyTo: `${displayName} <${emailAddress}>`
  }
}

module.exports = { getShopTransport, getNetworkTransport }
