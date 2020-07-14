// import useShopConfig from 'utils/useShopConfig'

import memoize from 'lodash/memoize'

const getCoinGeckoTokensList = memoize(async () => {
  const url = 'https://api.coingecko.com/api/v3/coins/list'
  const resp = await fetch(url)
  const data = await resp.json()

  return data
})

const getCoinGeckoTokenID = memoize(async (symbol) => {
  const tokensList = await getCoinGeckoTokensList()

  return tokensList.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase())
    .id
})

const coingeckoGetBySymbol = async (tokens) => {
  try {
    const _tokens = Array.isArray(tokens) ? tokens : [tokens]

    if (!_tokens.length) return {}

    const tokenIds = await Promise.all(
      _tokens.map(async (t) => await getCoinGeckoTokenID(t.name))
    )

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(
      ','
    )}&vs_currencies=usd`
    const resp = await fetch(url)
    const data = await resp.json()

    return tokenIds.reduce((out, tokenId, tokenIndex) => {
      const tokenData = _tokens[tokenIndex]

      if (data[tokenId]) {
        return {
          ...out,
          [tokenData.name]: 1 / data[tokenId].usd
        }
      }
    }, {})
  } catch (err) {
    console.error(err)
    return {}
  }
}

const coingeckoGetByAddress = async (tokens) => {
  try {
    const _tokens = Array.isArray(tokens) ? tokens : [tokens]

    if (!_tokens.length) return {}

    let url =
      'https://api.coingecko.com/api/v3/simple/token_price/ethereum?vs_currencies=usd'
    url = url + '&contract_addresses=' + _tokens.map((t) => t.address).join(',')

    const resp = await fetch(url)
    const data = await resp.json()

    return _tokens.reduce((out, token) => {
      if (data[token.address]) {
        return {
          ...out,
          [token.name]: 1 / data[token.address].usd
        }
      }
    }, {})
  } catch (err) {
    console.error(err)
    return {}
  }
}

const cryptocompareGet = async (tokens) => {
  try {
    const _tokens = Array.isArray(tokens) ? tokens : [tokens]

    if (!_tokens.length) return {}

    const tokenSymbols = _tokens.map((t) => t.name).join(',')

    const url = `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${tokenSymbols}`

    const resp = await fetch(url)
    const data = await resp.json()

    const out = {}

    for (const token in data) {
      out[token] = data[token]
    }

    return out
  } catch (err) {
    console.error(err)
    return {}
  }
}

const useTokenDataProviders = () => {
  // const { shopConfig } = useShopConfig()

  // const cryptocompareApiKey = get(shopConfig, 'cryptocompareApiKey')

  const out = [
    {
      id: 'coingecko_symbol',
      name: 'CoinGecko (by symbol)',
      getTokenPrices: coingeckoGetBySymbol
    },
    {
      id: 'coingecko_address',
      name: 'CoinGecko (by address)',
      getTokenPrices: coingeckoGetByAddress
    },
    {
      id: 'cryptocompare',
      name: 'CryptoCompare',
      getTokenPrices: cryptocompareGet
    }
  ]

  return {
    tokenDataProviders: out
  }
}

export default useTokenDataProviders
