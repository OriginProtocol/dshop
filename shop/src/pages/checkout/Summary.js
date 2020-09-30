import React, { useState } from 'react'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'
import CartIcon from 'components/icons/Cart'
import Caret from 'components/icons/Caret'
import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'

import CheckoutItem from './CheckoutItem'
import Discount from './Discount'
import Donation from './Donation'
import useCurrencyOpts from 'utils/useCurrencyOpts'

function summaryNote(note, cart, currencyOpts) {
  const donation = cart.donation || 0
  return note.replace(
    /\{subTotal\}/g,
    formatPrice(cart.subTotal + donation, currencyOpts)
  )
}

const ExchangeRateNote = ({ currencyOpts }) => {
  if (currencyOpts.storeCurrency === currencyOpts.currency) {
    return null
  }

  // TODO: Get a better copy from Anna.
  return (
    <div className="note">
      <fbt desc="checkout.exchangeRateNote">
        Prices are shown in{' '}
        <FbtParam name="currency">{currencyOpts.currency}</FbtParam> for
        reference at the exchange rate of 1{' '}
        <FbtParam name="actualCurrency">{currencyOpts.storeCurrency}</FbtParam>{' '}
        ={' '}
        <FbtParam name="exchangeRate">
          {currencyOpts.exchangeRate.toFixed(2)}
        </FbtParam>{' '}
        <FbtParam name="currency2">{currencyOpts.currency}</FbtParam>.
        You&apos;ll be charged in{' '}
        <FbtParam name="actualCurrency2">{currencyOpts.storeCurrency}</FbtParam>.
      </fbt>
    </div>
  )
}

const OrderSummary = ({ cart, discountForm = false, donationForm = false }) => {
  const { config } = useConfig()
  const [summary, showSummary] = useState(false)
  const currencyOpts = useCurrencyOpts()

  if (!cart || !cart.items) return null
  const donateTo = get(config, 'donations.name')

  return (
    <>
      <a
        className={`toggle-order-summary d-md-none${summary ? ' active' : ''}`}
        href="#"
        onClick={(e) => {
          e.preventDefault()
          showSummary(!summary)
        }}
      >
        <div className="txt">
          <CartIcon />
          {summary ? (
            <fbt desc="checkout.hideOrderSummary">Hide order summary</fbt>
          ) : (
            <fbt desc="checkout.showOrderSummary">Show order summary</fbt>
          )}
          <Caret />
        </div>
        <div>
          <b>{formatPrice(cart.total, currencyOpts)}</b>
        </div>
      </a>
      <div className={`order-summary ${summary ? ' show' : ''}`}>
        <div className="items">
          {cart.items.map((item, idx) => (
            <CheckoutItem key={idx} item={item} />
          ))}
        </div>
        {discountForm ? <Discount cart={cart} /> : null}
        {donationForm ? <Donation cart={cart} /> : null}
        <div className="sub-total">
          <div>
            <div>
              <fbt desc="Subtotal">Subtotal</fbt>
            </div>
            <div>
              <b>{formatPrice(cart.subTotal, currencyOpts)}</b>
            </div>
          </div>
          {!cart.donation ? null : (
            <div>
              <div>
                {donateTo ? (
                  <fbt desc="checkout.donateTo">
                    Donate to <FbtParam name="donateTo">{donateTo}</FbtParam>
                  </fbt>
                ) : (
                  <fbt desc="checkout.donation">Donation</fbt>
                )}
              </div>
              <div>
                <b>{formatPrice(cart.donation, currencyOpts)}</b>
              </div>
            </div>
          )}
          <div>
            <div>
              <fbt desc="Shipping">Shipping</fbt>
            </div>
            {cart.shipping ? (
              <div>
                <b>
                  {formatPrice(get(cart, 'shipping.amount'), {
                    ...currencyOpts,
                    free: true
                  })}
                </b>
              </div>
            ) : (
              <div>
                <fbt desc="checkout.shippingAtNextStep">
                  Calculated at next step
                </fbt>
              </div>
            )}
          </div>
          {cart.shipping && !cart.totalTaxes ? null : (
            <div className="flex justify-between">
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
            <div>
              <div>
                <fbt desc="Discount">Discount</fbt>{' '}
                {get(cart, 'discountObj.code', '').toUpperCase()}
              </div>
              <div>
                <b>{formatPrice(cart.discount, currencyOpts)}</b>
              </div>
            </div>
          )}
        </div>
        <div className="total">
          <div>
            <div>
              <fbt desc="Total">Total</fbt>
            </div>
            <div>
              <b>
                {formatPrice(cart.total, currencyOpts)}
                {currencyOpts.currency === currencyOpts.storeCurrency
                  ? null
                  : ` (${formatPrice(cart.total, {
                      currency: currencyOpts.storeCurrency
                    })})`}
              </b>
            </div>
          </div>
        </div>
        {!config.cartSummaryNote ? null : (
          <div
            dangerouslySetInnerHTML={{
              __html: summaryNote(config.cartSummaryNote, cart, currencyOpts)
            }}
            className="note"
          />
        )}
        <ExchangeRateNote currencyOpts={currencyOpts} />
      </div>
    </>
  )
}

export default OrderSummary

require('react-styl')(`
  .order-summary
    max-width: 430px
    .note
      text-align: center
      border: 1px solid #000
      border-radius: 2px
      margin-top: 1rem
      padding: 0.5rem
      a
        color: #007fff

    .item
      display: flex
      align-items: center
      margin-bottom: 1rem
      width: 100%
      .title
        font-weight: bold
        flex: 1
        padding-right: 1rem
        .cart-options
          font-size: 0.8rem
          font-weight: normal
      .price
        font-weight: bold
      .image
        position: relative
        margin-right: 1rem
        .product-pic
          border-radius: 0.5rem
          border: 1px solid #ddd
          min-width: 3rem
        span
          position: absolute
          display: block
          top: -0.5rem
          right: -0.5rem
          padding: 0.125rem 0.5rem
          background: #999
          color: #fff
          border-radius: 1rem
          font-size: 0.75rem
    img
      max-width: 60px
    .sub-total,.total,.discount,.donation
      margin-top: 1rem
      padding-top: 1rem
      border-top: 1px solid #ddd
      > div
        display: flex
        justify-content: space-between
        margin-bottom: 0.5rem
    .total
      font-size: 1.25rem

`)
