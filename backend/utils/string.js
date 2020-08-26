/**
 * Append e to s
 *
 * @param {string} s string we're appending to
 * @param {string} e string we're appending
 * @returns {string} s+e
 */
function append(s, e) {
  if (s.endsWith(e)) return s
  return `${s}${e}`
}

module.exports = {
  append
}
