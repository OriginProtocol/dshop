import React from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import { Countries, CountriesDefaultInfo } from '@origin/utils/Countries'

import validate from 'data/validations/checkoutInfo'
import { useStateValue } from 'data/state'
import useForm from 'utils/useForm'

import Link from 'components/Link'
import CountrySelect from 'components/CountrySelect'
import ProvinceSelect from 'components/ProvinceSelect'

export const Information = () => {
  const history = useHistory()
  const [{ cart }, dispatch] = useStateValue()

  const { state, setState, input, Feedback } = useForm(initialState(cart))

  const country = Countries[state.country] || 'United States'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const { valid, newState } = validate(state)
        setState(newState)
        if (!valid) {
          window.scrollTo(0, 0)
          return
        }
        dispatch({ type: 'updateUserInfo', info: newState })
        history.push({
          pathname: '/checkout/shipping',
          state: { scrollToTop: true }
        })
      }}
    >
      <div className="mb-2 text-lg font-medium">1. Contact information</div>
      <div className="grid grid-cols-2 p-4 bg-white shadow-lg gap-x-3 gap-y-2 dark:bg-gray-900">
        <label className="block mb-2 text-sm">Email</label>
        <label className="block mb-2 text-sm">Mobile Phone (optional)</label>
        <div>
          <input {...input('email')} />
          <Feedback error={state.emailError} />
        </div>
        <div>
          <input type="tel" {...input('phone')} />
          <Feedback error={state.phoneError} />
        </div>
      </div>
      <div className="mt-8 mb-2 text-lg font-medium">2. Shipping address</div>
      <div className="grid p-4 bg-white shadow-lg dark:bg-gray-900 gap-y-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <label className="block mb-2 text-sm">First Name</label>
          <label className="block mb-2 text-sm">Last Name</label>
          <div>
            <input {...input('firstName')} />
            <Feedback error={state.firstNameError} />
          </div>
          <div>
            <input type="tel" {...input('lastName')} />
            <Feedback error={state.lastNameError} />
          </div>
        </div>
        <label className="mt-3 text-sm">Street Address Line 1</label>
        <div>
          <input {...input('address1')} maxLength="80" />
          <Feedback error={state.address1Error} />
        </div>
        <label className="mt-3 text-sm">Street Address Line 2</label>
        <div>
          <input {...input('address2')} maxLength="25" />
          <Feedback error={state.address2Error} />
        </div>
        <label className="mt-3 text-sm">City</label>
        <div>
          <input {...input('city')} maxLength="25" />
          <Feedback error={state.cityError} />
        </div>
        <label className="mt-3 text-sm">Country</label>
        <CountrySelect
          className="w-full px-3 py-2 bg-gray-100 border dark:bg-black dark:border-gray-700"
          value={state.country}
          onChange={(e) => {
            const provinces = get(Countries[e.target.value], 'provinces')
            setState({
              country: e.target.value,
              province: provinces ? Object.keys(provinces)[0] : ''
            })
          }}
        />
        <div
          className={`mt-3 grid grid-cols-${
            country.provinces ? '2' : '1'
          } gap-x-3 gap-y-2`}
        >
          {!country.provinces ? null : (
            <label className="block mb-2 text-sm">State</label>
          )}
          <label className="block mb-2 text-sm">
            {get(country, 'labels.zip', CountriesDefaultInfo.labels.zip)}
          </label>
          {!country.provinces ? null : (
            <div>
              <ProvinceSelect
                className="w-full px-3 py-2 bg-gray-100 border"
                country={country}
                {...input('province')}
              />
              <Feedback error={state.provinceError} />
            </div>
          )}
          <div>
            <input {...input('zip')} />
            <Feedback error={state.zipError} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-12">
        <Link className="text-lg" to="/cart">
          &laquo; Return to cart
        </Link>
        <button className="px-8 btn btn-primary">Continue</button>
      </div>
    </form>
  )
}

export const MobileInformation = () => {
  const history = useHistory()
  const [{ cart }, dispatch] = useStateValue()
  const { state, input, Feedback, setState } = useForm(initialState(cart))

  const onSubmit = (e) => {
    e.preventDefault()
    const { valid, newState } = validate(state, ['emailError'])
    setState(newState)
    if (!valid) {
      window.scrollTo(0, 0)
      return
    }
    dispatch({ type: 'updateUserInfo', info: newState })
    history.push('/checkout/shipping-address')
  }
  return (
    <>
      <form
        className="p-8 bg-white shadow-lg dark:bg-gray-900"
        onSubmit={onSubmit}
      >
        <div className="mb-4 text-lg font-medium">1. Contact information</div>
        <label className="block mb-2 text-sm font-medium">Email</label>
        <div className="mb-6">
          <input {...input('email')} />
          <Feedback error={state.emailError} />
        </div>
        <label className="block mb-2 text-sm font-medium">
          Mobile Phone (optional)
        </label>
        <div className="mb-6">
          <input type="tel" {...input('phone')} />
          <Feedback error={state.phoneError} />
        </div>
        <button className="w-full btn btn-primary">Continue</button>
      </form>
      <div className="px-8 my-8 text-lg font-medium text-gray-500">
        2. Shipping address
      </div>
      <div className="px-8 my-8 text-lg font-medium text-gray-500">
        3. Shipping method
      </div>
      <div className="px-8 my-8 text-lg font-medium text-gray-500">
        4. Payment
      </div>
    </>
  )
}

function initialState(cart) {
  return {
    initialState: cart.userInfo || { country: 'United States' },
    className: 'border dark:border-gray-700 px-3 py-2 w-full',
    defaultClassName: 'dark:bg-black bg-gray-100',
    errorClassName:
      'dark:bg-black dark:border-red-600 bg-red-100 border-red-700',
    feedbackClassName: 'dark:text-white text-red-700 mt-1 text-sm'
  }
}
