module.exports = function formatPrice(number, opts = {}) {
  const {
    dec = 2,
    dsep = '.',
    tsep = ',',
    currency = 'USD',
    exchangeRate = 1
  } = opts

  let symbol
  if (currency === 'USD') {
    symbol = '$'
  } else if (currency === 'EUR') {
    symbol = '€'
  } else if (currency === 'GBP') {
    symbol = '£'
  } else if (currency === 'CAD') {
    symbol = '$'
  }

  if (opts.symbolOnly) {
    return symbol || currency
  }

  if (opts.free && !number) {
    return 'Free'
  }

  number = ((exchangeRate * number) / 100).toFixed(~~dec)
  const parts = number.split('.'),
    fnums = parts[0],
    decimals = parts[1] && parts[1] > 0 ? dsep + parts[1] : ''

  const withSeparator = fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep)
  const amount = `${withSeparator}${decimals}`
  return symbol ? `${symbol}${amount}` : `${amount} ${currency}`
}
