import get from 'lodash/get'

import { useStateValue } from 'data/state'

import usePrice from './usePrice'
import useConfig from './useConfig'

const useCurrencyOpts = () => {
  const { config } = useConfig()
  const [{ preferredCurrency }] = useStateValue()
  const storeCurrency = get(config, 'currency', 'USD')

  const { exchangeRates } = usePrice(storeCurrency)

  const preferredCurrencyRate = get(exchangeRates, preferredCurrency)
  const storeCurrencyRate = get(exchangeRates, storeCurrency)

  const hasExchangeRates = !!preferredCurrencyRate && !!storeCurrencyRate

  const targetCurrency = hasExchangeRates ? preferredCurrency : storeCurrency

  const rate =
    storeCurrency === preferredCurrency || !hasExchangeRates
      ? 1
      : preferredCurrencyRate / storeCurrencyRate

  return {
    storeCurrency,
    currency: targetCurrency,
    exchangeRate: rate
  }
}

export default useCurrencyOpts
