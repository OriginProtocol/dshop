const fetch = require('node-fetch')
const memoize = require('lodash/memoize')
const { getLogger } = require('../utils/logger')
const log = getLogger('routes.exchange-rates')

const baseCurrency = 'USD'

const currencies = [
  // Tokens:
  'ETH',
  'DAI',
  'OGN',
  'BAT',
  // Fiat:
  'KRW',
  'SGD',
  'GBP',
  'EUR',
  'JPY',
  'CNY'
]

/**
 * Fetches and populates the exchange rates of all tokens
 *
 * @returns {{[token: String] => [rate: Number]}} An object of token => rate values
 */
async function fetchExchangeRatesRaw(target = '', preferred = '') {
  target = target && !currencies.indexOf(target) >= 0 ? `,${target}` : ''
  preferred =
    preferred && !currencies.indexOf(preferred) >= 0 ? `,${preferred}` : ''

  const baseUrl = 'https://min-api.cryptocompare.com/data/price'
  const allCurrencies = `${currencies.join(',')}${target}${preferred}`
  const exchangeURL = `${baseUrl}?fsym=${baseCurrency}&tsyms=${allCurrencies}`
  const response = await fetch(exchangeURL)
  if (!response.ok) {
    throw new Error(response.error)
  }
  log.info('Fetched exchange rates OK')
  return await response.json()
}

const fetchExchangeRates = memoize(fetchExchangeRatesRaw, (...args) =>
  args.join('-')
)
// Clear cache every 5 mins
setInterval(() => fetchExchangeRates.cache.clear(), 1000 * 60 * 20)

module.exports = function (router) {
  router.post('/exchange-rates', (req, res) => {
    fetchExchangeRates(req.query.target, req.query.preferred)
      .then((rates) => res.json(rates))
      .catch(() => res.json({ success: false }))
  })
}
