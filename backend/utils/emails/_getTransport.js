const { getSiteConfig } = require('../../config')
const nodemailer = require('nodemailer')
const aws = require('aws-sdk')
const get = require('lodash/get')

const { Network } = require('../../models')

const encConf = require('../encryptedConfig')
const { IS_TEST, SUPPORT_EMAIL_OVERRIDE } = require('../const')

const getPlainEmail = (emailAddress) => {
  if (!emailAddress) return emailAddress
  const match = emailAddress.match(/<([^>]+)>/)

  return match ? match[1] : emailAddress
}

const DEFAULT_SUPPORT_EMAIL = SUPPORT_EMAIL_OVERRIDE || 'support@ogn.app'

/**
 * Returns config and email transporter object
 * @param {Model.Shop} shop DB model
 * @returns {{
 *  transporter,
 *  fromEmail,
 *  supportEmail,
 *  shopConfig, // Decrypted shop config
 *  configJson // Shop's public config.json file
 * }}
 **/
// TODO: Add unit test for this
async function getEmailTransporterAndConfig(shop, skipTestCheck = false) {
  if (IS_TEST && !skipTestCheck) {
    return {
      transporter: {
        sendMail: (message, cb) => cb(null, message)
      },
      supportEmail: 'support@ogn.app',
      configJson: {},
      shopConfig: {
        dataURL: 'https://testshop.ogn.app/data',
        publicURL: 'https://testshop.ogn.app'
      }
    }
  }

  const network = await Network.findOne({ where: { active: true } })
  const networkConfig = encConf.getConfig(network.config)
  const backendUrl = get(networkConfig, 'backendUrl', '')

  let emailServerConfig = {},
    configJson = {},
    shopConfig = {}

  let usingNetworkFallbacks = false

  if (shop) {
    configJson = await getSiteConfig(`${backendUrl}/${shop.authToken}/`)
    shopConfig = encConf.getConfig(shop.config)
    emailServerConfig = { ...shopConfig }
  }

  if ((!shopConfig.email || shopConfig.email === 'disabled') && network) {
    // Has not configured email server, fallback to network config
    const fallbackConfig = get(networkConfig, 'fallbackShopConfig', {})
    usingNetworkFallbacks = true
    emailServerConfig = {
      ...fallbackConfig
    }
  }

  let transporter
  if (IS_TEST && skipTestCheck) {
    // Skip creating nodemailer transport object
    // while running unit tests for this function
    transporter = {
      config: emailServerConfig
    }
  } else if (emailServerConfig.email === 'sendgrid') {
    let auth
    if (emailServerConfig.sendgridApiKey) {
      auth = {
        user: 'apikey',
        pass: emailServerConfig.sendgridApiKey
      }
    } else {
      auth = {
        user: emailServerConfig.sendgridUsername,
        pass: emailServerConfig.sendgridPassword
      }
    }
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth
    })
  } else if (emailServerConfig.email === 'mailgun') {
    transporter = nodemailer.createTransport({
      host: emailServerConfig.mailgunSmtpServer,
      port: emailServerConfig.mailgunSmtpPort,
      auth: {
        user: emailServerConfig.mailgunSmtpLogin,
        pass: emailServerConfig.mailgunSmtpPassword
      }
    })
  } else if (emailServerConfig.email === 'aws') {
    const SES = new aws.SES({
      apiVersion: '2010-12-01',
      region: emailServerConfig.awsRegion || 'us-east-1',
      accessKeyId: emailServerConfig.awsAccessKey,
      secretAccessKey: emailServerConfig.awsAccessSecret
    })
    transporter = nodemailer.createTransport({ SES })
  }

  let fromEmail
  let replyTo

  let supportEmail =
    configJson.supportEmail || shopConfig.supportEmail || DEFAULT_SUPPORT_EMAIL
  let storeEmail = shopConfig.storeEmail || shopConfig.fromEmail || supportEmail

  if (usingNetworkFallbacks) {
    fromEmail = DEFAULT_SUPPORT_EMAIL
    replyTo = supportEmail
  } else {
    fromEmail = supportEmail
  }

  fromEmail = getPlainEmail(fromEmail)
  supportEmail = getPlainEmail(supportEmail)
  replyTo = getPlainEmail(replyTo)
  storeEmail = getPlainEmail(storeEmail)

  return {
    transporter,

    fromEmail,
    replyTo,
    supportEmail,
    storeEmail,

    networkConfig,
    // Decrypted shop config
    shopConfig,
    // Shop's config.json
    configJson
  }
}

module.exports = getEmailTransporterAndConfig
