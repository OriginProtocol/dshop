const { getLogger } = require('./logger')

const log = getLogger('utils.stripe')

const DEFAULT_DESCRIPTOR = 'DSHOP'
const DESCRIPTOR_INVALID_CHARS = /[^A-Z ]/gi

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
    log.warn('Statement descriptor is missing or invalid')
    return DEFAULT_DESCRIPTOR
  }

  return d.replace(DESCRIPTOR_INVALID_CHARS, '')
}

module.exports = { normalizeDescriptor }
