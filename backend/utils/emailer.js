const { getSiteConfig } = require('../config')
const mjml2html = require('mjml')
const nodemailer = require('nodemailer')
const aws = require('aws-sdk')
const fetch = require('node-fetch')
const sharp = require('sharp')
const get = require('lodash/get')
const formatPrice = require('@origin/utils/formatPrice')
const { getLogger } = require('../utils/logger')

const { Network, Shop } = require('../models')

const cartData = require('./cartData')
const encConf = require('./encryptedConfig')
const { SUPPORT_EMAIL_OVERRIDE, IS_TEST } = require('./const')

const head = require('./templates/head')
const vendor = require('./templates/vendor')
const email = require('./templates/email')
const emailTxt = require('./templates/emailTxt')
const orderItem = require('./templates/orderItem')
const orderItemTxt = require('./templates/orderItemTxt')

const verifyEmail = require('./templates/verifyEmail')
const verifyEmailTxt = require('./templates/verifyEmailTxt')

const forgotPassEmail = require('./templates/forgotPassEmail')
const forgotPassEmailTxt = require('./templates/forgotPassEmailTxt')

const printfulOrderFailed = require('./templates/printfulOrderFailed')
const printfulOrderFailedTxt = require('./templates/printfulOrderFailedTxt')

const stripeWebhookError = require('./templates/stripeWebhookError')
const stripeWebhookErrorTxt = require('./templates/stripeWebhookErrorTxt')

const log = getLogger('utils.emailer')

const getPlainEmail = (emailAddress) => {
  if (!emailAddress) return emailAddress
  const match = emailAddress.match(/<([^>]+)>/)

  return match ? match[1] : emailAddress
}

function optionsForItem(item) {
  const options = []
  if (item.product.options && item.product.options.length && item.variant) {
    item.product.options.forEach((opt, idx) => {
      options.push(`${opt}: ${item.variant.options[idx]}`)
    })
  }
  return options
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
 */
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

async function sendNewOrderEmail(shop, cart, varsOverride, skip) {
  const {
    transporter,
    fromEmail,
    storeEmail,
    replyTo,
    supportEmail,
    configJson: data,
    shopConfig: config
  } = await getEmailTransporterAndConfig(shop)
  if (!transporter) {
    log.info(
      `Emailer not configured for shop id ${shop.id}. Skipping sending new order email.`
    )
    return
  }

  if (IS_TEST) {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  const dataURL = config.dataUrl
  let publicURL = config.publicUrl
  const items = IS_TEST ? [] : await cartData(dataURL, cart.items)
  const attachments = [],
    orderItems = []

  for (const item of items) {
    const img = item.variant.image || item.product.image
    const options = optionsForItem(item)
    const cid = img ? `${img.replace(/[^a-z]/g, '')}` : null

    if (img) {
      const imgStream = await fetch(`${dataURL}${item.product.id}/520/${img}`)
      const imgBlob = await imgStream.arrayBuffer()
      const content = await sharp(Buffer.from(imgBlob)).resize(100).toBuffer()

      attachments.push({ filename: img, content, cid })
    }

    orderItems.push(
      orderItem({
        img: img ? `cid:${cid}` : null,
        title: item.product.title,
        quantity: item.quantity,
        price: formatPrice(item.price, { currency: data.currency }),
        options: options.length
          ? `<div class="options">${options.join(', ')}</div>`
          : ''
      })
    )
  }

  const orderItemsTxt = items.map((item) => {
    const options = optionsForItem(item)
    return orderItemTxt({
      title: item.product.title,
      quantity: item.quantity,
      price: formatPrice(item.price, { currency: data.currency }),
      options: options.length ? `\n(${options.join(', ')})` : ''
    })
  })

  if (!data.absolute) {
    publicURL += '/#'
  }

  const { userInfo } = cart

  const shippingAddress = [
    `${userInfo.firstName} ${userInfo.lastName}`,
    `${userInfo.address1}`,
    `${userInfo.city} ${userInfo.province || ''} ${userInfo.zip}`,
    `${userInfo.country}`
  ]
  let billingAddress = shippingAddress
  if (userInfo.billingDifferent) {
    billingAddress = [
      `${userInfo.billingFirstName} ${userInfo.billingLastName}`,
      `${userInfo.billingAddress1}`,
      `${userInfo.billingCity} ${userInfo.billingProvince || ''} ${
        userInfo.billingZip
      }`,
      `${userInfo.billingCountry}`
    ]
  }

  const vars = {
    head,
    siteName: data.fullTitle || data.title,
    supportEmail,
    fromEmail,
    supportEmailPlain: supportEmail,
    subject: data.emailSubject,
    storeUrl: publicURL,

    orderNumber: cart.offerId,
    firstName: cart.userInfo.firstName,
    lastName: cart.userInfo.lastName,
    email: cart.userInfo.email,
    orderUrl: `${publicURL}/order/${cart.tx}?auth=${cart.dataKey}`,
    orderUrlAdmin: `${publicURL}/admin/orders/${cart.offerId}`,
    orderItems,
    orderItemsTxt,
    subTotal: formatPrice(cart.subTotal, { currency: data.currency }),
    hasDiscount: cart.discount > 0 ? true : false,
    discount: formatPrice(cart.discount, { currency: data.currency }),
    hasDonation: cart.donation > 0 ? true : false,
    donation: formatPrice(cart.donation, { currency: data.currency }),
    shipping: formatPrice(cart.shipping.amount, { currency: data.currency }),
    total: formatPrice(cart.total, { currency: data.currency }),
    shippingAddress,
    billingAddress,
    shippingMethod: cart.shipping.label,
    paymentMethod: cart.paymentMethod.label,
    ...varsOverride
  }

  const htmlOutputVendor = mjml2html(vendor(vars), { minify: true })
  const htmlOutput = mjml2html(email(vars), { minify: true })
  const txtOutput = emailTxt(vars)

  const message = {
    from: fromEmail,
    to: `${vars.firstName} ${vars.lastName} <${vars.email}>`,
    subject: vars.subject,
    html: htmlOutput.html,
    text: txtOutput,
    attachments,
    replyTo
  }

  const messageVendor = {
    from: fromEmail,
    to: storeEmail,
    subject: `[${vars.siteName}] Order #${cart.offerId}`,
    html: htmlOutputVendor.html,
    text: txtOutput,
    attachments,
    replyTo
  }

  if (!skip) {
    transporter.sendMail(message, (err, msg) => {
      if (err) {
        log.error('Error sending buyer confirmation email:', err)
      } else {
        log.info(
          `Buyer confirmation email sent, from ${message.from} to ${message.to}`
        )
        log.debug(msg.envelope)
      }
    })

    if (!vars.skipVendorMail) {
      transporter.sendMail(messageVendor, (err, msg) => {
        if (err) {
          log.error('Error sending merchant confirmation email:', err)
        } else {
          log.info(
            `Merchant confirmation email sent, from ${messageVendor.from} to ${messageVendor.to}`
          )
          log.debug(msg.envelope)
        }
      })
    }
  }

  return message
}

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

module.exports = {
  getEmailTransporterAndConfig,
  sendNewOrderEmail,
  sendVerifyEmail,
  sendPrintfulOrderFailedEmail,
  stripeWebhookErrorEmail,
  sendPasswordResetEmail
}
