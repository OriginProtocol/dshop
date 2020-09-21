import React from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

import Discount from './_Discount'

const OrderSummary = ({ cart, discount = true }) => {
  const currencyOpts = useCurrencyOpts()
  return (
    <>
      <div className="text-lg mb-2 font-medium">Order Summary</div>
      <div className="shadow-lg p-4 bg-white text-sm">
        <div
          className="grid gap-y-2"
          style={{ gridTemplateColumns: 'auto auto auto' }}
        >
          {cart.items.map((item) => (
            <Row
              key={`${item.product}-${item.variant}`}
              img={item.imageUrl}
              title={item.title}
              quantity={item.quantity}
              price={formatPrice(item.price, currencyOpts)}
            />
          ))}
        </div>
        {discount && <Discount />}
        <div className="flex justify-between mt-4">
          <div>Subtotal</div>
          <div>{formatPrice(cart.subTotal, currencyOpts)}</div>
        </div>
        <div className="flex justify-between mt-4">
          <div>Shipping</div>
          <div>
            {cart.shipping ? (
              formatPrice(get(cart, 'shipping.amount'), {
                ...currencyOpts,
                free: true
              })
            ) : (
              <fbt desc="checkout.shippingAtNextStep">
                Calculated at next step
              </fbt>
            )}
          </div>
        </div>
        {!cart.discount ? null : (
          <div className="flex justify-between mt-4">
            <div>
              <fbt desc="Discount">Discount</fbt>{' '}
              {get(cart, 'discountObj.code', '').toUpperCase()}
            </div>
            <div>{formatPrice(cart.discount, currencyOpts)}</div>
          </div>
        )}
        <div className="flex justify-between mt-4 border-t text-lg pt-4">
          <div>Total</div>
          <div>{formatPrice(cart.total, currencyOpts)}</div>
        </div>
      </div>
    </>
  )
}

const Row = ({ title, quantity, img, price }) => (
  <>
    <div className="border-b pb-3">
      <div className="flex items-center text-sm font-semibold">
        <img className="h-16 mr-5" src={img} />
        {title}
      </div>
    </div>
    <div className="border-b pb-3 text-sm flex items-center justify-center">
      {quantity}
    </div>
    <div className="border-b pb-3 text-sm flex items-center justify-end">
      {price}
    </div>
  </>
)

export default OrderSummary
