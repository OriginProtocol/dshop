import React from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import { fbt } from 'fbt-runtime'

import { formInput, formFeedback } from 'utils/formHelpers'
import useConfig from 'utils/useConfig'
import useSetState from 'utils/useSetState'
import { useStateValue } from 'data/state'
import { Countries } from '@origin/utils/Countries'

import Link from 'components/Link'
import ShippingForm from 'components/ShippingForm'

import BetaWarning from './_BetaWarning'

function validate(state) {
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

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const CheckoutInfo = () => {
  const { config } = useConfig()
  const history = useHistory()
  const [{ cart }, dispatch] = useStateValue()
  const [state, setState] = useSetState(
    cart.userInfo || { country: 'United States' }
  )

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <div className="checkout-information">
      <div className="d-none d-md-block">
        <h3>{config.fullTitle}</h3>
        <div className="breadcrumbs">
          <Link to="/cart">
            <fbt desc="Cart">Cart</fbt>
          </Link>
          <span>
            <b>
              <fbt desc="Information">Information</fbt>
            </b>
          </span>
          <span>
            <fbt desc="Shipping">Shipping</fbt>
          </span>
          <span>
            <fbt desc="Payment">Payment</fbt>
          </span>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const { valid, newState } = validate(state)
          setState(newState)
          if (valid) {
            dispatch({ type: 'updateUserInfo', info: newState })
            history.push({
              pathname: '/checkout/shipping',
              state: { scrollToTop: true }
            })
          } else {
            window.scrollTo(0, 0)
          }
        }}
      >
        <div className="mb-3">
          <b>
            <fbt desc="ContactInformation">Contact information</fbt>
          </b>
        </div>
        <div className="form-row">
          <div className="form-group col-md-6 mb-0">
            <div className="form-group">
              <input
                type="email"
                placeholder={fbt('Email', 'Email')}
                {...input('email')}
              />
              {Feedback('email')}
            </div>
          </div>
          <div className="form-group col-md-6">
            <input
              type="tel"
              placeholder="Mobile phone (optional)"
              {...input('phone')}
            />
            {Feedback('phone')}
          </div>
        </div>
        <div className="mb-3">
          <b>
            <fbt desc="ShippingAddress">Shipping Address</fbt>
          </b>
        </div>

        <ShippingForm {...{ state, setState, input, Feedback }} />

        <div className="actions">
          <Link to="/cart">
            &laquo; <fbt desc="checkout.goback">Return to cart</fbt>
          </Link>
          <button type="submit" className="btn btn-primary btn-lg">
            <fbt desc="checkout.continueShopping">Continue to shipping</fbt>
          </button>
        </div>
        <BetaWarning />
      </form>
    </div>
  )
}

export default CheckoutInfo

require('react-styl')(`
`)
