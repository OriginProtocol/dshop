const get = require('lodash/get')
const { Seller, Network } = require('../models')
const { createSalt, hashPassword, checkPassword } = require('../routes/_auth')

const sendVerifyEmail = require('./emails/verifyEmail')
const sendPasswordResetEmail = require('./emails/passwordReset')

const { getConfig } = require('./encryptedConfig')

const generateVerificationCode = (backendUrl) => {
  const code = Math.random().toString(36).substring(2)
  const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

  const verifyUrl = new URL(`${backendUrl}/verify-email`)
  verifyUrl.searchParams.set('code', code)

  return {
    code,
    expires,
    verifyUrl: verifyUrl.toString(),
    redirectTo: backendUrl
  }
}

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
  return sendPasswordResetEmail({
    network,
    seller: seller.get({ plain: true }),
    verifyUrl
  })
}

async function sendVerificationEmail(seller) {
  const network = await Network.findOne({ where: { active: true } })
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

  return sendVerifyEmail({
    seller: seller.get({ plain: true }),
    verifyUrl,
    network
  })
}

async function createSeller({ name, email, password }, opts) {
  if (!name || !email || !password) {
    return { status: 400, error: 'Invalid registration' }
  }
  const { superuser, skipEmailVerification } = opts || {} // Superuser creation must be done explicitly

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

  if (!skipEmailVerification) {
    // Send verification email
    await sendVerificationEmail(seller)
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
