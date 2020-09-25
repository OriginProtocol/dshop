import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import usePayment from 'utils/usePayment'

import Link from 'components/Link'

import PaymentChooser from 'components/payment/Chooser'

import { ContactInfo, ShippingAddress } from './_Summary'

export const Payment = () => {
  const history = useHistory()
  const { state, setState, onSubmit, disabled } = usePayment()
  const [{ cart }] = useStateValue()

  useEffect(() => {
    if (state.tx) {
      history.push(`/order/${state.tx}?auth=${state.encryptedData.auth}`)
    }
  }, [state.tx])

  return (
    <form onSubmit={onSubmit}>
      <ContactInfo cart={cart} />
      <ShippingAddress cart={cart} />

      <div className="text-lg mb-2 font-medium">3. Shipping method</div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2 mb-8">
        {get(cart, 'userInfo.zip')}, {get(cart, 'userInfo.country')}
      </div>
      <div className="mb-2 flex justify-between items-center">
        <div className="text-lg font-medium">4. Payment</div>
        <div className="text-gray-500">
          All transactions are secure and encrypted
        </div>
      </div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2">
        <PaymentChooser state={state} setState={setState} />
      </div>
      <div className="flex justify-between mt-12 items-center">
        <Link className="text-lg" to="/checkout">
          &laquo; Back
        </Link>
        <button
          type="submit"
          className={`btn btn-primary ${disabled ? ' opacity-50' : ''}`}
          children={state.buttonText}
        />
      </div>
    </form>
  )
}

export const MobilePayment = () => {
  const history = useHistory()
  const { state, setState, onSubmit, disabled } = usePayment()

  useEffect(() => {
    if (state.tx) {
      history.push(`/order/${state.tx}?auth=${state.encryptedData.auth}`)
    }
  }, [state.tx])

  return (
    <>
      <div className="text-lg font-medium text-gray-500 px-8 my-8 flex justify-between items-center">
        <div>1. Contact information</div>
        <Link to="/checkout">
          <img src="images/edit-icon.svg" />
        </Link>
      </div>

      <div className="text-lg font-medium text-gray-500 px-8 my-8 flex justify-between items-center">
        <div>2. Shipping Address</div>
        <Link to="/checkout/shipping-address">
          <img src="images/edit-icon.svg" />
        </Link>
      </div>
      <div className="text-lg font-medium text-gray-500 px-8 my-8 flex justify-between items-center">
        <div>3. Shipping Method</div>
        <Link to="/checkout/shipping">
          <img src="images/edit-icon.svg" />
        </Link>
      </div>

      <form onSubmit={onSubmit} className="shadow-lg p-8 bg-white">
        <div className="text-lg mb-4 font-medium">4. Payment</div>
        <div className="grid gap-y-2">
          <PaymentChooser state={state} setState={setState} />
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className={`btn btn-primary ${
              disabled ? ' opacity-50' : ''
            } w-full`}
            children={state.buttonText}
          />
        </div>
      </form>
    </>
  )
}
