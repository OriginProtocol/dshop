const memoize = require('lodash/memoize')

/**
 * Utility method to use as a wrapper for memoize when call on an async function.
 * Prevents memoize from caching the result in case the function throws an exception.
 *
 * @param {function} f: the function to call and cache result for
 * @param {function} resolver: function to get the cache key to use
 * @returns {function}
 */
function memoizePromise(f, resolver = (k) => k) {
  const memorizedFunction = memoize(async function (...args) {
    try {
      return await f(...args)
    } catch (e) {
      // Function threw an exception. Do not cache the result.
      memorizedFunction.cache.delete(resolver(...args))
      throw e
    }
  }, resolver)
  return memorizedFunction
}

module.exports = {
  memoizePromise
}
