import React from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

import Link from 'components/Link'

import Discount from './_Discount'

export const OrderSummary = ({ cart, discount = true }) => {
  const currencyOpts = useCurrencyOpts()

  console.log(cart)

  return (
    <>
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
      {cart.shipping && !cart.totalTaxes ? null : (
        <div className="flex justify-between mt-4">
          <div>
            <fbt desc="Taxes">Taxes</fbt>
          </div>

          <div>
            {cart.shipping ? (
              formatPrice(cart.totalTaxes, currencyOpts)
            ) : (
              <fbt desc="checkout.shippingAtNextStep">
                Calculated at next step
              </fbt>
            )}
          </div>
        </div>
      )}
      {!cart.discount ? null : (
        <div className="flex justify-between mt-4">
          <div>
            <fbt desc="Discount">Discount</fbt>{' '}
            {get(cart, 'discountObj.code', '').toUpperCase()}
          </div>
          <div>{formatPrice(cart.discount, currencyOpts)}</div>
        </div>
      )}
      <div className="flex justify-between mt-4 border-t text-lg pt-4 dark:border-gray-700">
        <div>Total</div>
        <div>{formatPrice(cart.total, currencyOpts)}</div>
      </div>
    </>
  )
}

const Row = ({ title, quantity, img, price }) => (
  <>
    <div className="border-b pb-3 dark:border-gray-700">
      <div className="flex items-center text-sm font-semibold">
        <img className="h-16 mr-5" src={img} />
        {title}
      </div>
    </div>
    <div className="border-b pb-3 px-2 text-sm flex items-center justify-center dark:border-gray-700">
      {quantity}
    </div>
    <div className="border-b pb-3 text-sm flex items-center justify-end dark:border-gray-700">
      {price}
    </div>
  </>
)

export const ContactInfo = ({ cart }) => (
  <>
    <div className="text-lg mb-2 font-medium">1. Contact information</div>
    <div className="shadow-lg p-4 bg-white dark:bg-gray-900 mb-8 text-sm flex items-center justify-between">
      <div>
        <div className="font-semibold">Email</div>
        <div className="mt-2">{get(cart, 'userInfo.email')}</div>
      </div>
      <Link to="/checkout">
        <img src="images/edit-icon.svg" />
      </Link>
    </div>
  </>
)

function name(cart) {
  return 'firstName lastName'
    .split(' ')
    .map((i) => get(cart, `userInfo.${i}`))
    .filter((i) => i)
    .join(' ')
}

function address(cart) {
  return 'address1 address2 city zip country'
    .split(' ')
    .map((i) => get(cart, `userInfo.${i}`))
    .filter((i) => i)
    .join(', ')
}

export const ShippingAddress = ({ cart }) => (
  <>
    <div className="text-lg mb-2 font-medium">2. Shipping address</div>
    <div className="shadow-lg p-4 bg-white dark:bg-gray-900 mb-8 text-sm flex items-center justify-between">
      <div>
        <div className="font-semibold">{name(cart)}</div>
        <div className="mt-2">{address(cart)}</div>
      </div>
      <Link to="/checkout">
        <img src="images/edit-icon.svg" />
      </Link>
    </div>
  </>
)
