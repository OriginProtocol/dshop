import React from 'react'
import { useHistory } from 'react-router-dom'
import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import useConfig from 'utils/useConfig'
import useSetState from 'utils/useSetState'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import ShippingForm from 'components/ShippingForm'

import BetaWarning from './_BetaWarning'

import validate from 'data/validations/checkoutInfo'

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
