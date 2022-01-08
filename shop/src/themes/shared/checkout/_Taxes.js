import get from 'lodash/get'
import { Countries } from '@origin/utils/Countries'

/*
 * @function determineTaxRateOnOrder Determines if the customer will need to pay taxes on their order, based on their shipping location
 * @param shopConfig <object> The shop's configuration
 * @param state <object> the State object of the component calling the function
 * @returns taxRate <integer> fixed point number with a scaling factor of 1/100, representing the configured tax rate (Ex: 1800 => 18%)
 */

const determineTaxRateOnOrder = (shopConfig, state) => {
  try {
    let taxRate = 0
    if (shopConfig.taxRates.length) {
      const taxedCountry = shopConfig.taxRates.find(
        (obj) => obj.country == Countries[state.country].code
      )

      //If taxes are configured on the 'country' level, do this
      taxRate = get(taxedCountry, 'rate', 0)

      //If taxes are configured at the 'province' level, do this
      if (state.province && taxedCountry.provinces) {
        const currentProvinceCode = get(
          Countries[state.country].provinces,
          state.province
        )['code']

        for (const provinceObject of taxedCountry.provinces) {
          if (provinceObject.province == currentProvinceCode) {
            taxRate = provinceObject.rate
            break
          }
        }
      }
    }
    return taxRate
  } catch (err) {
    console.error('Error: Taxes not added to cart', err)
  }
}

export default determineTaxRateOnOrder
