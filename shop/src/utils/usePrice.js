import { useState, useEffect } from 'react'
import get from 'lodash/get'
import memoize from 'lodash/memoize'

import useConfig from 'utils/useConfig'
const ratesUrl = 'https://bridge.originprotocol.com/utils/exchange-rates'
const cosUrl =
  'https://api.coingecko.com/api/v3/coins/markets?ids=contentos&vs_currency=usd'
const ratesByContractUrl =
  'https://api.coingecko.com/api/v3/simple/token_price/ethereum?vs_currencies=usd'

const memoFetch = memoize(async function (url) {
  return fetch(url).then((raw) => raw.json())
})

function usePrice() {
  const [exchangeRates, setRates] = useState({})
  const { config } = useConfig()

  useEffect(() => {
    async function fetchExchangeRates() {
      const json = await memoFetch(ratesUrl)
      const acceptedTokens = config.acceptedTokens || []

      // Special case for COS as it's not in coingecko rates by contract address API
      if (acceptedTokens.find((t) => t.id === 'token-COS')) {
        const cosData = await memoFetch(cosUrl)
        json.COS = 1 / get(cosData, '[0].current_price')
      }

      // Find tokens that don't have rates and look them up by contract address
      const withoutRates = acceptedTokens.filter((token) => {
        return !json[token.name] && token.address
      })
      if (withoutRates.length) {
        const addresses = withoutRates.map((t) => t.address)
        const url = `${ratesByContractUrl}&contract_addresses=${addresses}`
        const ratesByContract = await memoFetch(url)
        withoutRates.forEach(({ name, address }) => {
          if (ratesByContract[address]) {
            json[name] = 1 / ratesByContract[address].usd
          }
        })
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
