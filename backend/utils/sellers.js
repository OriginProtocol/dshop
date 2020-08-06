const get = require('lodash/get')
const { Seller, Shop, Network } = require('../models')
const { createSalt, hashPassword, checkPassword } = require('../routes/_auth')

const sendVerifyEmail = require('./emails/verifyEmail')
const sendPasswordResetEmail = require('./emails/passwordReset')

const { getConfig } = require('./encryptedConfig')

const { generateVerificationCode } = require('./emailVerification')

async function sendPasswordReset(seller) {
  const network = await Network.findOne({ where: { active: true } })
  const networkConfig = getConfig(network.config)
  const backendUrl = get(networkConfig, 'backendUrl')

  if (!backendUrl) {
    throw new Error('backendUrl missing from network config')
  }

  const { code, expires } = generateVerificationCode(backendUrl)

  await seller.update({
    data: {
      ...seller.data,
      passwordResetCode: code,
      passwordResetExpiresAt: expires
    }
  })
  const verifyUrl = `${backendUrl}/#/admin/reset-password?code=${code}`
  return sendPasswordResetEmail(seller.get({ plain: true }), verifyUrl)
}

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
  const backendUrl = get(networkConfig, 'backendUrl')
  if (!backendUrl) {
    throw new Error('backendUrl missing from network config')
  }

  const { code, expires, verifyUrl, redirectTo } = generateVerificationCode(
    backendUrl
  )

  await seller.update({
    data: {
      ...seller.data,
      emailVerificationCode: code,
      verificationExpiresAt: expires,
      verificationRedirectTo: redirectTo
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
  sendVerificationEmail,
  sendPasswordReset
}
