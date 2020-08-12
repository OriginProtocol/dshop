import get from 'lodash/get'

import { useStateValue } from 'data/state'

import usePrice from './usePrice'
import useConfig from './useConfig'

/**
 * Hook to get the user's preferred currency and it's exchange rate
 * to be passed as a param to `utils/formatPrice`
 *
 * @returns {{
 *  storeCurrency,
 *  currency,
 *  exchangeRate
 * }}
 */
const useCurrencyOpts = () => {
  const { config } = useConfig()
  const [{ preferredCurrency }] = useStateValue()
  const storeCurrency = get(config, 'currency', 'USD')

  const { exchangeRates } = usePrice(storeCurrency, preferredCurrency)

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
