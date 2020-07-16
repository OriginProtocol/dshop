const get = require('lodash/get')
const { Seller, Shop, Network } = require('../models')
const { createSalt, hashPassword, checkPassword } = require('../routes/_auth')

const { sendVerifyEmail } = require('./emailer')

const { getConfig } = require('./encryptedConfig')

const { generateVerificationCode } = require('./emailVerification')

async function sendVerificationEmail(seller, shopId) {
  if (!shopId) {
    return
  }
  const shop = await Shop.findOne({ where: { id: shopId } })
  if (!shop) {
    return
  }
  const network = await Network.findOne({
    where: { networkId: shop.networkId, active: true }
  })

  const networkConfig = getConfig(network.config)

  const backendUrl = get(networkConfig, 'backendUrl', '')

  const { code, expires, verifyUrl } = generateVerificationCode(backendUrl)

  await seller.update({
    data: {
      ...seller.data,
      emailVerificationCode: code,
      verificationExpiresAt: expires
    }
  })

  return sendVerifyEmail(seller.get({ plain: true }), verifyUrl, shopId)
}

async function createSeller({ name, email, password }, opts) {
  if (!name || !email || !password) {
    return { status: 400, error: 'Invalid registration' }
  }
  const { superuser, skipEmailVerification, shopId } = opts || {} // Superuser creation must be done explicitly

  const sellerCheck = await Seller.findOne({
    where: { email: email.toLowerCase() }
  })

  if (sellerCheck) {
    return { status: 409, error: 'Registration exists' }
  }

  const salt = await createSalt()
  const passwordHash = await hashPassword(salt, password)

  const seller = await Seller.create({
    name,
    email: email.toLowerCase(),
    password: passwordHash,
    superuser: superuser,
    emailVerified: false,
    data: {}
  })

  if (!skipEmailVerification && shopId) {
    // Send verification email
    await sendVerificationEmail(seller, shopId)
  }

  return { success: true, seller }
}

async function numSellers() {
  return await Seller.count()
}

async function findSeller(email) {
  const seller = await Seller.findOne({ where: { email: email.toLowerCase() } })
  return seller
}

async function authSeller(email, password) {
  const seller = await Seller.findOne({ where: { email: email.toLowerCase() } })
  return await checkPassword(password, seller.password)
}

module.exports = {
  findSeller,
  createSeller,
  authSeller,
  numSellers,
  sendVerificationEmail
}
