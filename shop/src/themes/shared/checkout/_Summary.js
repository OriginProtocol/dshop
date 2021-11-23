import React from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

import Link from 'components/Link'

import Discount from './_Discount'

export const OrderSummary = ({ cart, discount = true }) => {
  const currencyOpts = useCurrencyOpts()

  const discountType = get(cart, 'discountObj.discountType')
  const discountCode = get(cart, 'discountObj.code', '').toUpperCase()
  const paymentMethodTitle = get(cart, 'paymentMethod.label')
  const discountTitle =
    discountType === 'payment' ? `(${paymentMethodTitle})` : discountCode

  return (
    <>
      <div className="flex flex-col">
        {cart.items.map((item) => (
          <Row
            key={`${item.product}-${item.variant}`}
            img={item.imageUrl}
            title={item.title}
            productOptions={item.options.join(' / ')}
            quantity={item.quantity || 1}
            price={item.price}
            currencyOptions={currencyOpts}
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
            <fbt desc="Discount">Discount</fbt> {discountTitle}
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

const Row = ({
  title,
  productOptions,
  quantity,
  img,
  price,
  currencyOptions
}) => (
  <>
    <div className="flex justify-between pb-3 dark:border-gray-700">
      <div className="flex relative items-center text-sm font-semibold">
        <img className="h-16 w-16 box-content object-scale-down" src={img} />
        <span className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-gray-600 text-sm text-white flex justify-around items-center dark:border-gray-700">
          {quantity}
        </span>
      </div>
      <div className="flex flex-col justify-center">
        <div className="font-semibold">{title}</div>
        <div className="text-xs font-light">{productOptions}</div>
      </div>
      <div className="flex items-center justify-end font-semi-bold dark:border-gray-700">
        {formatPrice(quantity * price, currencyOptions)}
      </div>
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
