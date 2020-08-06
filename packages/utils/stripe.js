const DEFAULT_DESCRIPTOR = 'DSHOP'
const DESCRIPTOR_INVALID_CHARS = /[^A-Z ]/gi
const PUBLIC_KEY_PREFIXES = ['pk_test_', 'pk_live_']
const SECRET_KEY_PREFIXES = ['sk_test_', 'sk_live_']

/**
 * Normalize a "statement descriptor" for stripe payments.
 *
 * @see {@link https://stripe.com/docs/statement-descriptors}
 * @param d {string} - to normalie
 * @returns {string} normalized
 */
function normalizeDescriptor(d) {
  // Go to default if it's something we can't do anything with
  if (!d || typeof d !== 'string' || d.length < 5) {
    return DEFAULT_DESCRIPTOR
  }

  return d.replace(DESCRIPTOR_INVALID_CHARS, '')
}

/**
 * Validate publishable key
 *
 * @param key {string} - the key to validate
 * @returns {boolean} - if the key appears valid
 */
function validatePublishableKey(key) {
  return PUBLIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
}

/**
 * Validate secret key
 *
 * @param key {string} - the key to validate
 * @returns {boolean} - if the key appears valid
 */
function validateSecretKey(key) {
  return SECRET_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
}

/**
 * Validate secret key
 *
 * @param args {object} - args
 * @param args.publishableKey {string} - The Stripe publishable key
 * @param args.secretKey {string} - The Stripe secret key
 * @returns {boolean} - if the keys appear to be valid
 */
function validateStripeKeys({ publishableKey, secretKey }) {
  if (!publishableKey || !secretKey) {
    return false
  }

  // Make sure they're not a mix of live and test keys
  if (publishableKey.includes('live') && !secretKey.includes('live')) {
    return false
  }

  return validatePublishableKey(publishableKey) && validateSecretKey(secretKey)
}

module.exports = {
  normalizeDescriptor,
  validatePublishableKey,
  validateSecretKey,
  validateStripeKeys
}
