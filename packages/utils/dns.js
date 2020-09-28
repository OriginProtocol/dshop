const UNSTOPPABLE_TLDS = ['crypto']
const CRYPTO_TLDS = [...UNSTOPPABLE_TLDS]
// eslint-disable-next-line no-useless-escape
const DNS_VALID = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/

/**
 * Is the given hostname an unstoppable domain name?
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a crypto domain
 */
function isUnstoppableName(v) {
  if (typeof v !== 'string' || v.length <= 3 || !v.includes('.')) {
    return false
  }
  const tld = v.split('.').slice(-1)[0]
  return UNSTOPPABLE_TLDS.includes(tld)
}

/**
 * Is the given hostname a crypto name?
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a crypto domain
 */
function isCryptoName(v) {
  if (typeof v !== 'string' || v.length <= 3 || !v.includes('.')) {
    return false
  }
  const tld = v.split('.').slice(-1)[0]
  return CRYPTO_TLDS.includes(tld)
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

/**
 * Is the given hostname a valid DNS name
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a valid DNS name
 */
function isValidDNSName(v) {
  return v.includes('.') && v.match(DNS_VALID)
}

module.exports = {
  isUnstoppableName,
  isCryptoName,
  isPublicDNSName,
  isValidDNSName
}
