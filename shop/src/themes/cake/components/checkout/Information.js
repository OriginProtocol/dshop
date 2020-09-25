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
      <div className="text-lg mb-2 font-medium">1. Contact information</div>
      <div className="shadow-lg p-4 bg-white grid grid-cols-2 gap-x-3 gap-y-2">
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
      <div className="text-lg mb-2 mt-8 font-medium">2. Shipping address</div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2">
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
                className="border px-3 py-2 bg-gray-100 w-full"
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
      <div className="flex justify-between mt-12 items-center">
        <Link className="text-lg" to="/cart">
          &laquo; Return to cart
        </Link>
        <button className="btn btn-primary">Continue</button>
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

    const { valid, newState } = validate(state)
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
      <form className="shadow-lg p-8 bg-white" onSubmit={onSubmit}>
        <div className="text-lg mb-4 font-medium">1. Contact information</div>
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
        <button className="btn btn-primary w-full">Continue</button>
      </form>
      <div className="text-lg font-medium text-gray-500 px-8 my-8">
        2. Shipping address
      </div>
      <div className="text-lg font-medium text-gray-500 px-8 my-8">
        3. Shipping method
      </div>
      <div className="text-lg font-medium text-gray-500 px-8 my-8">
        4. Payment
      </div>
    </>
  )
}

function initialState(cart) {
  return {
    initialState: cart.userInfo || { country: 'United States' },
    className: 'border px-3 py-2 w-full',
    defaultClassName: 'bg-gray-100',
    errorClassName: 'bg-red-100 border-red-700',
    feedbackClassName: 'text-red-700 mt-1 text-sm'
  }
}
