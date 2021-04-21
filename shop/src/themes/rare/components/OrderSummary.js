import React from 'react'

const OrderSummary = ({ state, quantity, field = 'priceDAIQ' }) => (
  <>
    <div className="text-lg font-medium">Order Summary</div>
    <div className="bg-gray-900 rounded-lg px-4 py-4 mt-4 text-sm font-medium">
      <div className="flex leading-none items-center">
        <div className="hidden sm:flex text-xs font-semibold rounded-full bg-purple-600 w-16 h-16 text-black items-center justify-center">
          $CHICO
        </div>
        <div className="flex-1 flex flex-col sm:ml-2 justify-center">
          <div>Chico Coin</div>
          <div className="font-medium mt-1 text-purple-600">$CHICO</div>
        </div>
        <div className="mx-6">{quantity}</div>
        <div>{`${state[field]} USD`}</div>
      </div>
      <div className="my-4 pt-6 border-t border-gray-600 flex justify-between">
        <div>Subtotal</div>
        <div>{`${state[field]} USD`}</div>
      </div>
      <div className="my-4 flex justify-between">
        <div>Transaction Fee</div>
        <div>0.00 USD</div>
      </div>
      <div className="mt-6 pt-6 pb-4 border-t border-gray-600 flex justify-between">
        <div>Total</div>
        <div>{`${state[field]} USD`}</div>
      </div>
    </div>
  </>
)

export default OrderSummary
