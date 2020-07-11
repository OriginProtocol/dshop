const { getSiteConfig } = require('../config')
const mjml2html = require('mjml')
const nodemailer = require('nodemailer')
const aws = require('aws-sdk')
const fetch = require('node-fetch')
const sharp = require('sharp')

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

const pritnfulOrderFailed = require('./templates/printfulOrderFailed')
const pritnfulOrderFailedTxt = require('./templates/pritnfulOrderFailedTxt')

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

async function getEmailTransporter(shop) {
  let networkConfig = {}

  const shopConfig = encConf.getConfig(shop.config)

  let config = {
    ...shopConfig
  }

  // Try network's default config,
  try {
    if (!shopConfig.email) {
      // Has not configured email server, fallback to network config
      const network = await Network.findOne({
        where: { networkId: shop.networkId, active: true }
      })

      if (network) {
        networkConfig = encConf.getConfig(network.config)
        networkConfig = JSON.parse(networkConfig.defaultShopConfig)

        config = {
          ...networkConfig
        }
      }
    }
  } catch (err) {
    log.error(`Failed to fetch network's default config`, err)
  }

  let transporter
  if (config.email === 'sendgrid') {
    let auth
    if (config.sendgridApiKey) {
      auth = {
        user: 'apikey',
        pass: config.sendgridApiKey
      }
    } else {
      auth = {
        user: config.sendgridUsername,
        pass: config.sendgridPassword
      }
    }
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth
    })
  } else if (config.email === 'mailgun') {
    transporter = nodemailer.createTransport({
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
      region: config.awsRegion || 'us-east-1',
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsAccessSecret
    })
    transporter = nodemailer.createTransport({ SES })
  }

  return transporter
}

async function sendNewOrderEmail(shop, cart, varsOverride, skip) {
  const transporter = await getEmailTransporter(shop)
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

  const config = encConf.getConfig(shop.config)

  const dataURL = config.dataUrl
  let publicURL = config.publicUrl
  const data = await getSiteConfig(dataURL)
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

  let supportEmailPlain = SUPPORT_EMAIL_OVERRIDE || data.supportEmail
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
    supportEmail: SUPPORT_EMAIL_OVERRIDE || data.supportEmail,
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
    from: vars.supportEmail,
    to: `${vars.firstName} ${vars.lastName} <${vars.email}>`,
    subject: vars.subject,
    html: htmlOutput.html,
    text: txtOutput,
    attachments
  }

  const messageVendor = {
    from: vars.supportEmail,
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
        log.info('Buyer confirmation email sent')
        log.debug(msg.envelope)
      }
    })

    if (!vars.skipVendorMail) {
      transporter.sendMail(messageVendor, (err, msg) => {
        if (err) {
          log.error('Error sending merchant confirmation email:', err)
        } else {
          log.info('Merchant confirmation email sent')
          log.debug(msg.envelope)
        }
      })
    }
  }

  return message
}

async function sendVerifyEmail(seller, verifyUrl, shopId, skip) {
  const shop = await Shop.findOne({ where: { id: shopId } })
  const transporter = await getEmailTransporter(shop)
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
    supportEmailPlain: SUPPORT_EMAIL_OVERRIDE || 'dshop@originprotocol.com'
  }

  const htmlOutput = mjml2html(verifyEmail(vars), { minify: true })

  const txtOutput = verifyEmailTxt(vars)

  const message = {
    from: vars.supportEmailPlain,
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
        log.debug(msg.envelope)
        log.debug(msg)
      }

      resolve(message)
    })
  })
}

async function sendPrintfulOrderFailedEmail(shopId, orderData, opts, skip) {
  const shop = await Shop.findOne({ where: { id: shopId } })
  const transporter = await getEmailTransporter(shop)
  if (!transporter) {
    log.info(
      `Emailer not configured for shop id ${shopId}. Skipping sending Printful order failed email.`
    )
    return
  }

  const config = encConf.getConfig(shop.config)
  if (process.env.NODE_ENV === 'test') {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  const dataURL = config.dataUrl
  const publicURL = config.publicUrl

  const data = await getSiteConfig(dataURL)
  const cart = orderData.data

  const vars = {
    head,
    supportEmail: SUPPORT_EMAIL_OVERRIDE || 'dshop@originprotocol.com',
    message: opts ? opts.message : '',
    orderUrlAdmin: `${publicURL}/admin/orders/${cart.offerId}`,
    siteName: data.fullTitle || data.title
  }

  const htmlOutput = mjml2html(pritnfulOrderFailed(vars), { minify: true })
  const txtOutput = pritnfulOrderFailedTxt(vars)

  const message = {
    from: vars.supportEmail,
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
        log.debug(msg.envelope)
        log.debug(msg)
      }

      resolve(message)
    })
  })
}

module.exports = {
  sendNewOrderEmail,
  sendVerifyEmail,
  sendPrintfulOrderFailedEmail
}
