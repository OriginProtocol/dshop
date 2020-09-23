import React from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import formatPrice from 'utils/formatPrice'
import fbt from 'fbt'

import { useStateValue } from 'data/state'
import useShipping from 'utils/useShipping'
import useCurrencyOpts from 'utils/useCurrencyOpts'

import Link from 'components/Link'

import { ContactInfo, ShippingAddress } from './_Summary'

const Picker = () => {
  const [{ cart }, dispatch] = useStateValue()
  const currencyOpts = useCurrencyOpts()

  const { unshippableItems, zones, loading } = useShipping()
  return (
    <>
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
    </>
  )
}

const Shipping = () => {
  const history = useHistory()
  const [{ cart }] = useStateValue()
  const { unshippableItems, zones } = useShipping()
  const disabled = unshippableItems.length || !zones.length

  return (
    <>
      <ContactInfo cart={cart} />
      <ShippingAddress cart={cart} />

      <div className="text-lg mb-2 font-medium">3. Shipping method</div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2">
        <Picker />
      </div>
      <div className="flex justify-between mt-12 items-center">
        <Link className="text-lg" to="/checkout">
          &laquo; Back
        </Link>
        <a
          href="#"
          className={`btn btn-primary${disabled ? ' opacity-50' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            if (!disabled) {
              history.push('/checkout/payment')
            }
          }}
        >
          Continue
        </a>
      </div>
    </>
  )
}

export default Shipping
