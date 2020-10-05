import fbt from 'fbt'
import get from 'lodash/get'
import pickBy from 'lodash/pickBy'

import { CountriesByCode } from '@origin/utils/Countries'

const removeErrorKeys = (obj) => {
  return {
    ...pickBy(obj, (v, k) => !k.endsWith('Error'))
  }
}

const isEmptyRateObj = (rateObj) => {
  return rateObj.rate === 0 && !rateObj.country
}

export default (state) => {
  const newState = removeErrorKeys(state)

  const taxRates = get(newState, 'taxRates', [])
  const hasAddedNothing = taxRates.length === 1 && isEmptyRateObj(taxRates[0])

  if (!taxRates.length || hasAddedNothing) {
    // Nothing to validate
    return {
      valid: true,
      newState: {
        ...newState,
        // Let's not populate empty object in taxRates
        // when there is nothing
        taxRates: undefined
      }
    }
  }

  let validRates = true

  newState.taxRates = taxRates.map((rate) => {
    const validatedRateObj = {
      ...rate
    }
    if (!validatedRateObj.country) {
      validatedRateObj.countryError = fbt(
        'Country is required',
        'admin.settings.checkout.taxes.countryError'
      )
      validRates = false
    }

    const countryObj = CountriesByCode[validatedRateObj.country]

    if (countryObj && countryObj.provinces) {
      const provinces = get(validatedRateObj, 'provinces')

      if (provinces) {
        validatedRateObj.provinces = provinces.map((province) => {
          const validatedObj = { ...province }

          if (!validatedObj.province) {
            validatedObj.provinceError = fbt(
              'Province is required',
              'admin.settings.checkout.taxes.provinceError'
            )
            validRates = false
          } else if (Number.isNaN(parseFloat(validatedObj.rate))) {
            validatedObj.rateError = fbt(
              'Invalid rate',
              'admin.settings.checkout.taxes.rateError'
            )
            validRates = false
          }

          return validatedObj
        })
      }
    } else if (Number.isNaN(parseFloat(validatedRateObj.rate))) {
      validatedRateObj.rateError = fbt(
        'Invalid rate',
        'admin.settings.checkout.taxes.rateError'
      )
      validRates = false
    }

    return validatedRateObj
  })

  const valid =
    validRates && Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return {
    valid,
    newState
  }
}
