import { useState, useEffect } from 'react'

const ratesUrl = 'https://bridge.originprotocol.com/utils/exchange-rates'

function usePrice() {
  const [exchangeRates, setRates] = useState({})

  useEffect(() => {
    async function fetchExchangeRates() {
      const raw = await fetch(ratesUrl)
      const json = await raw.json()
      setRates(json)
    }
    fetchExchangeRates()
  }, [])

  function toTokenPrice(fiat, token) {
    if (!exchangeRates[token]) return ''
    return String((fiat / 100) * exchangeRates[token]).substr(0, 6)
  }

  return { exchangeRates, toTokenPrice }
}

export default usePrice
