import React from 'react'
import { useHistory } from 'react-router-dom'
import fbt from 'fbt'
import get from 'lodash/get'

import { formInput, formFeedback } from 'utils/formHelpers'
import useConfig from 'utils/useConfig'
import useSetState from 'utils/useSetState'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import ShippingForm from 'components/ShippingForm'

import BetaWarning from './_BetaWarning'

import validate from 'data/validations/checkoutInfo'
import { Countries } from '@origin/utils/Countries'

const CheckoutInfo = () => {
  const { config } = useConfig()
  const history = useHistory()
  const [{ cart }, dispatch] = useStateValue()
  const [state, setState] = useSetState(
    cart.userInfo || { country: 'United States' }
  )
  const shippingApi = get(config, 'shippingApi')
  const { post } = useBackendApi({ authToken: true })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const onSubmit = async (e) => {
    e.preventDefault()

    if (state.submitting) return

    const { valid, newState } = validate(state)
    setState({ ...newState, submitting: valid })

    if (valid) {
      let taxRate = 0

      const manualTaxRates = get(config, 'taxRates')

      if (shippingApi) {
        const { city, province, country, zip } = newState

        const countryObj = Countries[country]
        const countryCode = get(countryObj, 'code')

        const provinceObj = get(countryObj, 'provinces', {})[province]

        let provinceCode = ''
        if (province && provinceObj) {
          provinceCode = provinceObj.code
        }

        const response = await post('/printful/tax-rates', {
          body: JSON.stringify({
            recipient: {
              city,
              countryCode,
              provinceCode,
              zip
            }
          }),
          suppressError: true
        })

        if (response.success) {
          taxRate = response.required ? response.rate : 0
        } else {
          setState({
            submitting: false,
            taxError:
              response.reason ||
              fbt(
                `Couldn't estimate tax rates for the given address, make sure it is valid.`,
                'checkout.taxRateError'
              )
          })
        }
      } else if (manualTaxRates && manualTaxRates.length) {
        const { province, country } = newState

        const countryObj = Countries[country]
        const countryCode = get(countryObj, 'code')

        const countryTaxObj = manualTaxRates.find(
          (rateObj) => rateObj.country === countryCode
        )
        const provinceObj = get(countryObj, 'provinces', {})[province]

        let provinceCode = ''
        if (province && provinceObj) {
          provinceCode = provinceObj.code
        }

        const provinceTaxObj = get(countryTaxObj, 'provinces', []).find(
          (rateObj) => rateObj.province === provinceCode
        )

        if (provinceTaxObj) {
          taxRate = provinceTaxObj.rate
        } else if (countryTaxObj) {
          taxRate = countryTaxObj.rate
        } else {
          taxRate = 0
        }
      }

      dispatch({ type: 'updateTaxRate', taxRate })
      dispatch({ type: 'updateUserInfo', info: newState })
      history.push({
        pathname: '/checkout/shipping',
        state: { scrollToTop: true }
      })
    } else {
      window.scrollTo(0, 0)
    }
  }

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
      <form onSubmit={onSubmit}>
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

        {!state.taxError ? null : (
          <div className="alert alert-danger">{state.taxError}</div>
        )}

        <div className="actions">
          <Link to="/cart">
            &laquo; <fbt desc="checkout.goback">Return to cart</fbt>
          </Link>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={state.submitting}
          >
            {state.submitting ? (
              <>
                <fbt desc="Submitting">Submitting</fbt>...
              </>
            ) : (
              <fbt desc="checkout.continueShopping">Continue to shipping</fbt>
            )}
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
