const difference = require('lodash/difference')
const { assert } = require('./validators')

/**
 * Check if all alements in one array are in another and vice-versa
 *
 * @param a {array}
 * @param b {array}
 * @returns {boolean} - if arrays have the same elements
 */
function allIn(a, b) {
  assert(a instanceof Array, 'a is not an array')
  assert(b instanceof Array, 'b is not an array')

  if (a.length !== b.length) {
    return false
  }

  return difference(a, b).length === 0
}

module.exports = { allIn }
