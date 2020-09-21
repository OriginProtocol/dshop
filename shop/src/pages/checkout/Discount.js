import React, { useState } from 'react'
import get from 'lodash/get'
import fbt from 'fbt'
import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

const OrderDiscount = ({ cart }) => {
  const { config } = useConfig()
  const [error, setError] = useState()
  const [code, setCode] = useState('')
  const [, dispatch] = useStateValue()
  if (!config.discountCodes || !cart || !cart.items) return null
  const existingCode = get(cart, 'discountObj.code', '').toUpperCase()

  return (
    <form
      className="discount"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!code) {
          return
        }
        const response = await fetch(`${config.backend}/check-discount`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `bearer ${encodeURIComponent(
              config.backendAuthToken
            )}`
          },
          body: JSON.stringify({ code })
        }).then((res) => res.json())

        const discount = response.discount || response
        if (!discount || !discount.code) {
          setError(true)
        } else {
          dispatch({ type: 'setDiscount', discount })
          setCode('')
          setError(false)
        }
      }}
    >
      <div className="d-flex">
        <input
          type="text"
          className="form-control"
          placeholder={fbt('Discount code', 'checkout.discounts.code')}
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            if (!e.target.value) {
              setError(false)
            }
          }}
        />
        <button
          type="submit"
          className={`btn btn-${code ? 'primary' : 'secondary'} ml-2`}
        >
          <fbt desc="Apply">Apply</fbt>
        </button>
      </div>
      {!error ? null : (
        <div className="invalid-feedback" style={{ display: 'block' }}>
          <fbt desc="checkout.discounts.invalidCode">
            Enter a valid discount code
          </fbt>
        </div>
      )}
      {!existingCode ? null : (
        <div>
          <span className="badge badge-secondary">
            {existingCode}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setCode('')
                dispatch({ type: 'removeDiscount' })
              }}
              style={{ color: 'white' }}
            >
              &times;
            </a>
          </span>
        </div>
      )}
    </form>
  )
}

export default OrderDiscount
