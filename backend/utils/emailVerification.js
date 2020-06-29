const generateVerificationCode = (publicUrl) => {
  const code = Math.random().toString(36).substring(2)
  const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

  const verifyUrl = new URL(`${publicUrl}/sellers/verify-email`)
  verifyUrl.searchParams.set('code', code)

  return {
    code,
    expires,
    verifyUrl: verifyUrl.toString()
  }
}

const verifyEmailCode = (code, seller) => {
  if (!seller || !seller.data) {
    return {
      error: 'Invalid code'
    }
  }

  if (seller.data.emailVerificationCode !== code) {
    return {
      error: 'Invalid code'
    }
  }

  if (Date.now() > seller.data.verificationExpiresAt) {
    return {
      error: 'Code expired'
    }
  }

  return {
    success: true
  }
}

module.exports = { generateVerificationCode, verifyEmailCode }
