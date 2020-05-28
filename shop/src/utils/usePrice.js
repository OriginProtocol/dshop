import { useState, useEffect } from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
const ratesUrl = 'https://bridge.originprotocol.com/utils/exchange-rates'
const cosUrl = 'https://api.coingecko.com/api/v3/coins/markets?ids=contentos&vs_currency=usd'

function usePrice() {
  const [exchangeRates, setRates] = useState({})
  const { config } = useConfig()

  useEffect(() => {
    async function fetchExchangeRates() {
      const raw = await fetch(ratesUrl)
      const json = await raw.json()
      const acceptedTokens = config.acceptedTokens || []
      if (acceptedTokens.find((t) => t.id === 'token-COS')) {
        const cosData = await fetch(cosUrl).then(raw => raw.json())
        json.COS = 1 / get(cosData, '[0].current_price')
      }
      setRates(json)
    }
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

  return { exchangeRates, toTokenPrice, toFiatPrice }
}

export default usePrice
