/**
 * Masks all characters of string except first and last `n` chars
 * @param {String} secret text to mask
 * @param {Number} maxLen max length of resultant string
 */
const maskSecret = (secret, maxLen) => {
  if (!secret) return
  const shouldTruncate = maxLen && secret.length > maxLen

  return `${secret
    .substr(
      0,
      shouldTruncate
        ? Math.min(maxLen / 2, secret.length - 4)
        : secret.length - 4
    )
    .replace(/[^-]/g, 'x')}${shouldTruncate ? '...' : ''}${secret.substr(
    shouldTruncate ? -(maxLen / 2) : -4
  )}`
}

export default maskSecret
