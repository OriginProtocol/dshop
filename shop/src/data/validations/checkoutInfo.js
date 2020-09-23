import fbt from 'fbt'
import get from 'lodash/get'

import { Countries } from '@origin/utils/Countries'

function validate(state, fields) {
  const newState = {}

  if (!state.email) {
    newState.emailError = fbt(
      'Enter an email address',
      'checkout.address.emailError'
    )
  } else if (state.email.length < 3) {
    newState.emailError = fbt(
      'Email is too short',
      'checkout.address.emailLenError'
    )
  }
  if (!state.firstName) {
    newState.firstNameError = fbt(
      'Enter a first name',
      'checkout.address.firstNameError'
    )
  }
  if (!state.lastName) {
    newState.lastNameError = fbt(
      'Enter a last name',
      'checkout.address.lastNameError'
    )
  }
  if (!state.address1) {
    newState.address1Error = fbt(
      'Enter an address',
      'checkout.address.address1Error'
    )
  } else if (state.address1.length > 80) {
    newState.address1Error = fbt(
      'Address too long',
      'checkout.address.address1LenError'
    )
  }
  if (state.address2 && state.address2.length > 25) {
    newState.address2Error = fbt(
      'Address too long',
      'checkout.address.address2Error'
    )
  }
  if (!state.city) {
    newState.cityError = fbt('Enter a city', 'checkout.address.cityError')
  } else if (state.city.length > 32) {
    newState.cityError = fbt(
      'City name too long',
      'checkout.address.cityLenError'
    )
  }
  const provinces = get(Countries, `${state.country}.provinces`, {})
  if (!state.province && Object.keys(provinces).length) {
    newState.provinceError = fbt(
      'Enter a state / province',
      'checkout.address.provinceError'
    )
  }
  if (!state.zip) {
    newState.zipError = fbt(
      'Enter a ZIP / postal code',
      'checkout.address.zipError'
    )
  } else if (state.zip.length > 10) {
    newState.zipError = fbt(
      'ZIP / postal code too long',
      'checkout.address.zipLenError'
    )
  }

  let filteredFields = Object.keys(newState)
  if (fields && fields.length) {
    filteredFields = filteredFields.filter((f) => fields.indexOf(f) >= 0)
  }

  const valid = filteredFields.every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

export default validate
