import React from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import formatPrice from 'utils/formatPrice'
import fbt from 'fbt'

import { Countries, CountriesDefaultInfo } from '@origin/utils/Countries'

import { useStateValue } from 'data/state'
import useShipping from 'utils/useShipping'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import validate from 'data/validations/checkoutInfo'
import useForm from 'utils/useForm'

import Link from 'components/Link'
import CountrySelect from 'components/CountrySelect'
import ProvinceSelect from 'components/ProvinceSelect'

import { ContactInfo, ShippingAddress } from './_Summary'

const Picker = ({ className }) => {
  const [{ cart }, dispatch] = useStateValue()
  const currencyOpts = useCurrencyOpts()

  const { unshippableItems, zones, loading } = useShipping()
  return (
    <div className={className}>
      {unshippableItems.length ? (
        <>
          Sorry, these items cannot be shipped to{' '}
          {get(cart, 'userInfo.country')}
          <ul className="mt-2">
            {unshippableItems.map((item, idx) => (
              <li key={idx}>{item.title}</li>
            ))}
          </ul>
        </>
      ) : loading ? (
        <fbt desc="checkout.shipping.loadingCosts">
          Loading shipping costs...
        </fbt>
      ) : !zones.length ? (
        <fbt desc="checkout.shipping.loadError">
          Sorry, there was an error calculating shipping costs.
        </fbt>
      ) : (
        zones.map((zone) => (
          <label key={zone.id} className="flex items-center">
            <input
              type="radio"
              name="shippingMethod"
              checked={get(cart, 'shipping.id') === zone.id}
              onChange={() => dispatch({ type: 'updateShipping', zone })}
            />
            <div className="ml-3">
              <div>{zone.label}</div>
              <div className="description">{zone.detail}</div>
            </div>
            <span className="ml-auto">
              {zone.amount ? (
                formatPrice(zone.amount, currencyOpts)
              ) : (
                <fbt desc="Free">Free</fbt>
              )}
            </span>
          </label>
        ))
      )}
    </div>
  )
}

export const Shipping = () => {
  const history = useHistory()
  const [{ cart }] = useStateValue()
  const { unshippableItems, zones } = useShipping()
  const disabled = unshippableItems.length || !zones.length

  return (
    <>
      <ContactInfo cart={cart} />
      <ShippingAddress cart={cart} />

      <div className="text-lg mb-2 font-medium">3. Shipping method</div>
      <Picker className="shadow-lg p-4 bg-white dark:bg-gray-900 grid gap-y-2" />

      <div className="flex justify-between mt-12 items-center">
        <Link className="text-lg" to="/checkout">
          &laquo; Back
        </Link>
        <a
          href="#"
          className={`btn btn-primary px-8${disabled ? ' opacity-50' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            if (disabled) return
            history.push('/checkout/payment')
          }}
        >
          Continue
        </a>
      </div>
    </>
  )
}

export const MobileShipping = () => (
  <>
    <div className="text-lg font-medium text-gray-500 px-8 my-8 flex justify-between items-center">
      <div>1. Contact information</div>
      <Link to="/checkout">
        <img src="images/edit-icon.svg" />
      </Link>
    </div>
    <div className="text-lg font-medium text-gray-500 px-8 my-8 flex justify-between items-center">
      <div>2. Shipping Address</div>
      <Link to="/checkout">
        <img src="images/edit-icon.svg" />
      </Link>
    </div>
    <div className="shadow-lg p-8 bg-white dark:bg-gray-900">
      <div className="text-lg mb-4 font-medium">3. Shipping method</div>
      <Picker className="mb-6" />
      <Link to="/checkout/payment" className="btn btn-primary w-full">
        Continue
      </Link>
    </div>
    <div className="text-lg font-medium text-gray-500 px-8 my-8">
      4. Payment
    </div>
  </>
)

export const MobileShippingAddress = () => {
  const history = useHistory()
  const [{ cart }, dispatch] = useStateValue()
  const { state, input, Feedback, setState } = useForm({
    initialState: cart.userInfo || { country: 'United States' },
    className: 'border px-3 py-2 w-full',
    defaultClassName: 'bg-gray-100',
    errorClassName: 'bg-red-100 border-red-700',
    feedbackClassName: 'text-red-700 mt-1 text-sm'
  })

  const country = Countries[state.country] || 'United States'

  const onSubmit = (e) => {
    e.preventDefault()

    const { valid, newState } = validate(state)
    setState(newState)
    if (!valid) {
      window.scrollTo(0, 0)
      return
    }
    dispatch({ type: 'updateUserInfo', info: newState })
    history.push('/checkout/shipping')
  }
  return (
    <>
      <div className="text-lg font-medium text-gray-500 px-8 my-8 flex justify-between items-center">
        <div>1. Contact information</div>
        <Link to="/checkout">
          <img src="images/edit-icon.svg" />
        </Link>
      </div>
      <form
        className="shadow-lg p-8 bg-white dark:bg-gray-900"
        onSubmit={onSubmit}
      >
        <div className="text-lg mb-4 font-medium">2. Shipping address</div>
        <label className="block mb-2 text-sm font-medium">First Name</label>
        <div className="mb-6">
          <input {...input('firstName')} />
          <Feedback error={state.firstNameError} />
        </div>
        <label className="block mb-2 text-sm font-medium">Last Name</label>
        <div className="mb-6">
          <input type="tel" {...input('lastName')} />
          <Feedback error={state.lastNameError} />
        </div>
        <label className="block mb-2 text-sm font-medium">
          Street Address Line 1
        </label>
        <div className="mb-6">
          <input {...input('address1')} maxLength="80" />
          <Feedback error={state.address1Error} />
        </div>
        <label className="block mb-2 text-sm font-medium">
          Street Address Line 2
        </label>
        <div className="mb-6">
          <input {...input('address2')} maxLength="25" />
          <Feedback error={state.address2Error} />
        </div>
        <label className="block mb-2 text-sm font-medium">City</label>
        <div className="mb-6">
          <input {...input('city')} maxLength="25" />
          <Feedback error={state.cityError} />
        </div>
        <label className="block mb-2 text-sm font-medium">Country</label>
        <div className="mb-6">
          <CountrySelect
            className="border px-3 py-2 bg-gray-100 w-full"
            value={state.country}
            onChange={(e) => {
              const provinces = get(Countries[e.target.value], 'provinces')
              setState({
                country: e.target.value,
                province: provinces ? Object.keys(provinces)[0] : ''
              })
            }}
          />
        </div>
        {!country.provinces ? null : (
          <>
            <label className="block mb-2 text-sm font-medium">State</label>
            <div className="mb-6">
              <ProvinceSelect
                className="border px-3 py-2 bg-gray-100 w-full"
                country={country}
                {...input('province')}
              />
              <Feedback error={state.provinceError} />
            </div>
          </>
        )}
        <label className="block mb-2 text-sm font-medium">
          {get(country, 'labels.zip', CountriesDefaultInfo.labels.zip)}
        </label>
        <div className="mb-6">
          <input {...input('zip')} />
          <Feedback error={state.zipError} />
        </div>
        <button className="btn btn-primary w-full">Continue</button>
      </form>
      <div className="text-lg font-medium text-gray-500 px-8 my-8">
        3. Shipping method
      </div>
      <div className="text-lg font-medium text-gray-500 px-8 my-8">
        4. Payment
      </div>
    </>
  )
}

export default Shipping
