import { useState, useEffect } from 'react'
import memoize from 'lodash/memoize'

import useConfig from 'utils/useConfig'

import useTokenDataProviders from 'utils/useTokenDataProviders'

const ratesUrl = 'https://bridge.originprotocol.com/utils/exchange-rates'

const memoFetch = memoize(async function (url) {
  return fetch(url).then((raw) => raw.json())
})

function usePrice() {
  const [exchangeRates, setRates] = useState({})
  const { config } = useConfig()

  const { tokenDataProviders } = useTokenDataProviders()

  async function fetchExchangeRates() {
    let json = await memoFetch(ratesUrl)
    const acceptedTokens = config.acceptedTokens || []

    // Find tokens that don't have rates and look them up by contract address
    const withoutRates = acceptedTokens.filter((token) => {
      return !json[token.name] && token.address
    })
    if (withoutRates.length) {
      const rates = await tokenDataProviders.reduce(async (rates, provider) => {
        const filteredTokens = withoutRates.filter((token) =>
          token.apiProvider
            ? token.apiProvider === provider.id
            : provider.id === 'coingecko_symbol'
        )

        if (filteredTokens.length === 0) return rates

        return {
          ...rates,
          ...(await provider.getTokenPrices(filteredTokens))
        }
      }, {})

      json = {
        ...json,
        ...rates
      }
    }

    setRates(json)
  }

  useEffect(() => {
    if (!exchangeRates.ETH) {
      fetchExchangeRates()
    }
  }, [])

  function toTokenPrice(fiat, token) {
    if (!exchangeRates[token]) return ''
    return String((fiat / 100) * exchangeRates[token]).substr(0, 6)
  }

  function toFiatPrice(value, token) {
    if (!exchangeRates[token]) return ''
    return ((value * 1) / exchangeRates[token]).toFixed(2)
  }

  return {
    exchangeRates,
    toTokenPrice,
    toFiatPrice,
    refetch: fetchExchangeRates
  }
}

export default usePrice
