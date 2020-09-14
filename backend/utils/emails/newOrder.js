const fetch = require('node-fetch')
const mjml2html = require('mjml')
const sharp = require('sharp')
const formatPrice = require('@origin/utils/formatPrice')

const { getLogger } = require('../../utils/logger')
const cartData = require('../cartData')
const { IS_TEST } = require('../const')
const encConf = require('../../utils/encryptedConfig')

const { getShopTransport } = require('./_getTransport')
const head = require('./templates/_head')
const vendor = require('./templates/newOrderVendor')
const email = require('./templates/newOrder')
const emailTxt = require('./templates/newOrderTxt')
const orderItem = require('./templates/_orderItem')
const orderItemTxt = require('./templates/_orderItemTxt')

const log = getLogger('utils.emailer')

function optionsForItem(item) {
  const options = []
  if (item.product.options && item.product.options.length && item.variant) {
    item.product.options.forEach((opt, idx) => {
      options.push(`${opt}: ${item.variant.options[idx]}`)
    })
  }
  return options
}

async function sendNewOrderEmail({
  orderId,
  order,
  shop,
  network,
  cart,
  varsOverride,
  skip
}) {
  const { transporter, from, replyTo } = await getShopTransport(shop, network)
  if (!transporter) {
    log.info(`No email transport configured. Skiped sending new order email.`)
    return
  }

  if (IS_TEST) {
    log.info('Test environment. Email will be generated but not sent.')
    skip = true
  }

  const networkConfig = encConf.getConfig(network.config)
  const shopConfig = encConf.getConfig(shop.config)
  const dataURL = shopConfig.dataUrl
  const publicURL = `${shopConfig.publicUrl}/#`
  const currency = cart.currency

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
        price: formatPrice(item.price, { currency }),
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
      price: formatPrice(item.price, { currency }),
      options: options.length ? `\n(${options.join(', ')})` : ''
    })
  })

  const { userInfo } = cart

  const shippingAddress = [
    `${userInfo.firstName} ${userInfo.lastName}`,
    userInfo.address1,
    userInfo.address2,
    `${userInfo.city} ${userInfo.province || ''} ${userInfo.zip}`,
    `${userInfo.country}`
  ].filter((i) => i)
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

  // Generate the link for the buyer to see their order.
  // If the order was recorded on the marketplace, the link uses the transaction hash.
  // Otherwise the link uses the IPFS hash of the encrypted data.
  const orderUrl = order.offerId
    ? `${publicURL}/order/${cart.tx}?auth=${cart.dataKey}`
    : `${publicURL}/order/${order.encryptedIpfsHash}?auth=${cart.dataKey}`

  // Link for the merchant to the orders admin page.
  const orderUrlAdmin = `${networkConfig.backendUrl}/#/admin/orders/${orderId}`

  const subject = shopConfig.emailSubject || `Your ${shop.name} order`

  const vars = {
    head,
    siteName: shop.name,
    supportEmail: `${shopConfig.supportEmail}`,
    fromEmail: from,
    supportEmailPlain: shopConfig.supportEmail,
    subject,
    storeUrl: publicURL,
    orderNumber: orderId,
    firstName: cart.userInfo.firstName,
    lastName: cart.userInfo.lastName,
    email: cart.userInfo.email,
    orderUrl,
    orderUrlAdmin,
    orderItems,
    orderItemsTxt,
    subTotal: formatPrice(cart.subTotal, { currency }),
    hasDiscount: cart.discount > 0 ? true : false,
    discount: formatPrice(cart.discount, { currency }),
    hasDonation: cart.donation > 0 ? true : false,
    donation: formatPrice(cart.donation, { currency }),
    shipping: formatPrice(cart.shipping.amount, { currency }),
    total: formatPrice(cart.total, { currency }),
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
    from,
    to: `${vars.firstName} ${vars.lastName} <${vars.email}>`,
    subject: vars.subject,
    html: htmlOutput.html,
    text: txtOutput,
    attachments,
    replyTo
  }

  const messageVendor = {
    from,
    to: shopConfig.supportEmail
      ? `${vars.siteName} <${shopConfig.supportEmail}>`
      : null,
    subject: `[${vars.siteName}] Order #${orderId}`,
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

    if (!vars.skipVendorMail && messageVendor.to) {
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

module.exports = sendNewOrderEmail
