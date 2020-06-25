import React from 'react'

import ShippingForm from 'components/ShippingForm'

const BillingAddress = ({ formState, setFormState, input, Feedback }) => {
  const active = formState.billingDifferent
  return (
    <>
      <div className="mt-4 mb-3">
        <b>Billing Address</b>
        <div>Select the address that matches your card or payment method.</div>
      </div>
      <div className="checkout-payment-method">
        <label className={`radio ${active ? 'active' : 'inactive'}`}>
          <input
            type="radio"
            name="billingDifferent"
            checked={formState.billingDifferent ? false : true}
            onChange={() => setFormState({ billingDifferent: false })}
          />
          <div>
            <div>Same as shipping address</div>
          </div>
        </label>
        <label className={`radio ${active ? 'active mb-1' : 'inactive'}`}>
          <input
            type="radio"
            name="billingDifferent"
            checked={formState.billingDifferent ? true : false}
            onChange={() => setFormState({ billingDifferent: true })}
          />
          <div>
            <div>Use a different billing address</div>
          </div>
        </label>
        {!formState.billingDifferent ? null : (
          <div className="px-3">
            <ShippingForm
              prefix="billing"
              {...{ state: formState, setState: setFormState, input, Feedback }}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default BillingAddress
