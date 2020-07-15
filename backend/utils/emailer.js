const { getSiteConfig } = require('../config')
const mjml2html = require('mjml')
const nodemailer = require('nodemailer')
const aws = require('aws-sdk')
const fetch = require('node-fetch')
const sharp = require('sharp')
const get = require('lodash/get')

const { getLogger } = require('../utils/logger')

const { Network, Shop } = require('../models')

const cartData = require('./cartData')
const encConf = require('./encryptedConfig')
const { SUPPORT_EMAIL_OVERRIDE } = require('./const')

const head = require('./templates/head')
const vendor = require('./templates/vendor')
const email = require('./templates/email')
const emailTxt = require('./templates/emailTxt')
const orderItem = require('./templates/orderItem')
const orderItemTxt = require('./templates/orderItemTxt')

const verifyEmail = require('./templates/verifyEmail')
const verifyEmailTxt = require('./templates/verifyEmailTxt')

const printfulOrderFailed = require('./templates/printfulOrderFailed')
const printfulOrderFailedTxt = require('./templates/printfulOrderFailedTxt')

const stripeWebhookError = require('./templates/stripeWebhookError')
const stripeWebhookErrorTxt = require('./templates/stripeWebhookErrorTxt')

const log = getLogger('utils.emailer')

function formatPrice(num) {
  return `$${(num / 100).toFixed(2)}`
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
async function getEmailTransporterAndConfig(shop) {
  const network = await Network.findOne({
    where: { networkId: shop.networkId, active: true }
  })

  const networkConfig = encConf.getConfig(network.config)

  const backendUrl = get(networkConfig, 'backendUrl', '')
  const configJson = await getSiteConfig(`${backendUrl}/${shop.authToken}/`)

  const shopConfig = encConf.getConfig(shop.config)

  let emailServerConfig = {
    ...shopConfig
  }

  if ((!shopConfig.email || shopConfig.email === 'disabled') && network) {
    // Has not configured email server, fallback to network config
    const fallbackConfig = get(networkConfig, 'fallbackShopConfig', {})
    emailServerConfig = {
      ...fallbackConfig
    }
  }

  let transporter
  if (emailServerConfig.email === 'sendgrid') {
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

  return {
    transporter,
    fromEmail:
      SUPPORT_EMAIL_OVERRIDE || shopConfig.fromEmail || 'no-reply@ogn.app',
    supportEmail:
      SUPPORT_EMAIL_OVERRIDE ||
      configJson.supportEmail ||
      'dshop@originprotocol.com',
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

  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  // const config = encConf.getConfig(shop.config)

  const dataURL = config.dataUrl
  let publicURL = config.publicUrl
  // const data = await getSiteConfig(dataURL)
  const items = await cartData(dataURL, cart.items)
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
        price: formatPrice(item.price),
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
      price: formatPrice(item.price),
      options: options.length ? `\n(${options.join(', ')})` : ''
    })
  })

  let supportEmailPlain = supportEmail
  if (supportEmailPlain.match(/<([^>]+)>/)[1]) {
    supportEmailPlain = supportEmailPlain.match(/<([^>]+)>/)[1]
  }

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
    fromEmail: supportEmail,
    supportEmailPlain,
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
    subTotal: formatPrice(cart.subTotal),
    hasDiscount: cart.discount > 0 ? true : false,
    discount: formatPrice(cart.discount),
    hasDonation: cart.donation > 0 ? true : false,
    donation: formatPrice(cart.donation),
    shipping: formatPrice(cart.shipping.amount),
    total: formatPrice(cart.total),
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
    from: vars.fromEmail,
    to: `${vars.firstName} ${vars.lastName} <${vars.email}>`,
    subject: vars.subject,
    html: htmlOutput.html,
    text: txtOutput,
    attachments
  }

  const messageVendor = {
    from: vars.fromEmail,
    to: vars.supportEmail,
    subject: `[${vars.siteName}] Order #${cart.offerId}`,
    html: htmlOutputVendor.html,
    text: txtOutput,
    attachments
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
            `Merchant confirmation email sent, from ${message.from} to ${message.to}`
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
    from: vars.fromEmail,
    to: `${name} <${email}>`,
    subject: 'Confirm your email address',
    html: htmlOutput.html,
    text: txtOutput
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

async function sendPrintfulOrderFailedEmail(shopId, orderData, opts, skip) {
  const shop = await Shop.findOne({ where: { id: shopId } })
  const {
    transporter,
    fromEmail,
    supportEmail,
    shopConfig: config,
    configJson: data
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
    from: vars.fromEmail,
    to: vars.supportEmail,
    subject: 'Failed to create order on Printful',
    html: htmlOutput.html,
    text: txtOutput
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
    configJson: data
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
    from: vars.fromEmail,
    to: vars.supportEmail,
    subject: 'Failed to process stripe webhook event',
    html: htmlOutput.html,
    text: txtOutput
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
  sendNewOrderEmail,
  sendVerifyEmail,
  sendPrintfulOrderFailedEmail,
  stripeWebhookErrorEmail
}
