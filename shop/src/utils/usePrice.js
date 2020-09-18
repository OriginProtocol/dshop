import { useState, useEffect } from 'react'
import memoize from 'lodash/memoize'

import useConfig from 'utils/useConfig'
import formatPrice from 'utils/formatPrice'

import useTokenDataProviders from 'utils/useTokenDataProviders'

const memoFetch = memoize(async function (url, body = {}) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
  }).then((raw) => raw.json())
})

function usePrice(targetCurrency = 'USD', preferredCurrency = 'USD') {
  const [exchangeRates, setRates] = useState({})
  const { config } = useConfig()

  const { tokenDataProviders } = useTokenDataProviders()

  async function fetchExchangeRates() {
    let url = `${config.backend}/exchange-rates?target=${targetCurrency}`
    if (preferredCurrency !== targetCurrency) {
      url += `&preferred=${preferredCurrency}`
    }
    let json = await memoFetch(url)
    json.USD = 1
    json.OUSD = 1
    const acceptedTokens = config.acceptedTokens || []

    // Find tokens that don't have rates and look them up by contract address
    const withoutRates = acceptedTokens.filter(
      (token) => !json[token.name] && token.address
    )
    if (withoutRates.length) {
      const rates = await tokenDataProviders.reduce(async (rates, provider) => {
        const filteredTokens = withoutRates.filter((token) =>
          token.apiProvider
            ? token.apiProvider === provider.id
            : provider.id === 'coingecko_symbol'
        )

        if (filteredTokens.length === 0) return rates

        const tokenPrices = await provider.getTokenPrices(filteredTokens)
        return { ...rates, ...tokenPrices }
      }, {})

      json = { ...json, ...rates }
    }

    setRates(json)
  }

  useEffect(() => {
    if (!exchangeRates[preferredCurrency]) {
      fetchExchangeRates()
    }
  }, [preferredCurrency])

  function toTokenPrice(fiat, token) {
    const tokenPriceUsd = exchangeRates[token]
    if (!tokenPriceUsd || !exchangeRates[targetCurrency]) return ''
    const tokenPrice = tokenPriceUsd / exchangeRates[targetCurrency]
    return String((fiat / 100) * tokenPrice).substr(0, 6)
  }

  function toFiatPrice(value, token) {
    const tokenPriceUsd = exchangeRates[token]
    if (!tokenPriceUsd || !exchangeRates[targetCurrency]) return ''
    const tokenPrice = tokenPriceUsd / exchangeRates[targetCurrency]
    return formatPrice(value / tokenPrice, { currency: targetCurrency })
  }

  return {
    exchangeRates,
    toTokenPrice,
    toFiatPrice,
    refetch: fetchExchangeRates
  }
}

export default usePrice
