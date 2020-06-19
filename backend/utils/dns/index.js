const UNSTOPPABLE_TLDS = ['crypto']
const CRYPTO_DOMAINS = [...UNSTOPPABLE_TLDS]

/**
 * Is the given hostname a crypto name?
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a crypto domain
 */
function isCryptoName(v, tlds = CRYPTO_DOMAINS) {
  if (typeof v !== 'string' || v.length <= 3 || !v.includes('.')) {
    return false
  }
  const tld = v.split('.').slice(-1)[0]
  return tlds.includes(tld)
}

/**
 * Is the given hostname an unstoppable domain name?
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a crypto domain
 */
function isUnsoppableName(v) {
  return isCryptoName(v, UNSTOPPABLE_TLDS)
}

/**
 * Is the given hostname a public DNS name
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a public DNS name
 */
function isPublicDNSName(v) {
  return (
    !isCryptoName(v) && typeof v === 'string' && v.length > 3 && v.includes('.')
  )
}

module.exports = {
  isPublicDNSName,
  isUnsoppableName,
  isCryptoName
}
