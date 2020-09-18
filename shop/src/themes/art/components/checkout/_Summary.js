import React from 'react'

import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

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
              img="peer-art/mool-c26/520/upload_2e596930586d9b842fc35efac45cfded"
              title={item.title}
              quantity={item.quantity}
              price={formatPrice(item.price, currencyOpts)}
            />
          ))}
        </div>
        {discount && (
          <>
            <div className="mt-4">Discount code</div>
            <div className="flex justify-between text-lg pt-4 border-b pb-4">
              <input className="border px-2 py-2 bg-gray-100 w-full" />
              <button className="btn ml-2 py-2 text-sm">Apply</button>
            </div>
          </>
        )}
        <div className="flex justify-between mt-4">
          <div>Subtotal</div>
          <div>{formatPrice(cart.subTotal, currencyOpts)}</div>
        </div>
        <div className="flex justify-between mt-4">
          <div>Shipping</div>
          <div>Calculated at next step</div>
        </div>
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
