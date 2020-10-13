import React, { useState, useEffect } from 'react'
import { useLocation, useRouteMatch } from 'react-router-dom'
import queryString from 'query-string'
import get from 'lodash/get'
import Styl from 'react-styl'
import fbt, { FbtParam } from 'fbt'

import Link from 'components/Link'
import CheckCircle from 'components/icons/CheckCircle'
import PaymentInstructions from 'components/OfflinePaymentInstructions'
import { useStateValue } from 'data/state'

import useConfig from 'utils/useConfig'
import useOrigin from 'utils/useOrigin'
import formatAddress from 'utils/formatAddress'
import usePGP from 'utils/usePGP'
import Summary from './checkout/Summary'

const OrderDetails = ({ cart }) => {
  const { config } = useConfig()
  if (!cart) {
    return (
      <div>
        <fbt desc="Loading">Loading</fbt>...
      </div>
    )
  }

  const phone = get(cart, 'userInfo.phone')

  const isOfflinePayment = !!get(cart, 'paymentMethod.instructions', false)

  return (
    <div className="checkout-confirmation">
      <div className="d-none d-md-block">
        <h3>{config.fullTitle}</h3>
      </div>
      <div className="thankyou">
        <div className="check">
          <CheckCircle />
        </div>
        <div className="details">
          {!cart.offerId ? null : (
            <div className="order-number">
              <fbt desc="order.orderNumber">
                Order #<FbtParam name="order.offerId">{cart.offerId}</FbtParam>
              </fbt>
            </div>
          )}
          <div className="name">
            <fbt desc="order.thankUser">
              Thank you{' '}
              <FbtParam name="order.userName">
                {get(cart, 'userInfo.firstName')}
              </FbtParam>!
            </fbt>
          </div>
        </div>
      </div>
      <div className="order-confirmed">
        <div className="title">
          <fbt desc="order.confirmedText">Your order is confirmed</fbt>
        </div>
        <div className="description">
          <fbt desc="order.emailOnUpdate">
            You’ll receive an email when your order is ready.
          </fbt>
        </div>
      </div>
      <div className="customer-info">
        <h4>
          <fbt desc="order.customerInfo">Customer information</fbt>
        </h4>
        <div className="row">
          <div className="col-md-6">
            <h5>
              <fbt desc="order.contactInfo">Contact information</fbt>
            </h5>
            <div className="value">{get(cart, 'userInfo.email')}</div>
            {!phone ? null : <div className="value">{phone}</div>}
          </div>
          <div className="col-md-6">
            <h5>
              <fbt desc="PaymentMethod">Payment method</fbt>
            </h5>
            <div className="value">{get(cart, 'paymentMethod.label')}</div>
            {!isOfflinePayment ? null : (
              <>
                <PaymentInstructions
                  paymentMethod={get(cart, 'paymentMethod')}
                />
              </>
            )}
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <h5>
              <fbt desc="ShippingAddress">Shipping address</fbt>
            </h5>
            <div className="value">
              {formatAddress(cart.userInfo).map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
          <div className="col-md-6">
            <h5>
              <fbt desc="BillingAddress">Billing address</fbt>
            </h5>
            <div className="value">
              {formatAddress(
                cart.userInfo,
                cart.userInfo.billingDifferent ? 'billing' : null
              ).map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <h5>
              <fbt desc="ShippingMethod">Shipping method</fbt>
            </h5>
            {get(cart, 'shipping.label')}
          </div>
        </div>
      </div>

      <div className="actions">
        <div>
          <fbt desc="order.needHelp">Need help?</fbt>{' '}
          <a href={`mailto:${config.supportEmailPlain}`}>
            <fbt desc="ContactUs">Contact us</fbt>
          </a>
        </div>
        <Link className="btn btn-primary btn-lg" to="/">
          <fbt desc="ContinueShipping">Continue shopping</fbt>
        </Link>
      </div>
    </div>
  )
}

const Order = () => {
  const { config } = useConfig()
  const { getOffer, status } = useOrigin()
  const [, dispatch] = useStateValue()
  const [cart, setCart] = useState()
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const match = useRouteMatch('/order/:tx')
  const location = useLocation()
  const opts = queryString.parse(location.search)
  const { pgpLoaded } = usePGP()

  useEffect(() => {
    async function go() {
      const { tx } = match.params
      const result = await getOffer({ tx, password: opts.auth })
      if (result) {
        setCart(result.cart)
        setError(false)
        dispatch({ type: 'orderComplete' })
      } else {
        setError(true)
      }
      setLoading(false)
    }
    if (getOffer && !cart && !loading && status !== 'loading' && pgpLoaded) {
      setLoading(true)
      go()
    }
  }, [match.params.tx, opts.auth, status, pgpLoaded])

  useEffect(() => {
    if (!window.orderCss) {
      // Need to re-add stylesheet as this component is lazy loaded
      Styl.addStylesheet()
      window.orderCss = true
    }
  }, [])

  if (loading || status === 'loading') {
    return (
      <div className="loading-fullpage">
        <fbt desc="Loading">Loading</fbt>
      </div>
    )
  } else if (error) {
    return (
      <div className="checkout">
        <h3 className="d-md-none my-4 ml-4">{config.title}</h3>
        <div className="user-details">
          <fbt desc="order.loadError">Error loading order</fbt>
        </div>
        <div className="order-summary-wrap"></div>
      </div>
    )
  }

  return (
    <div className="checkout">
      <h3 className="d-md-none my-4 ml-4">{config.title}</h3>
      <div className="user-details">
        <OrderDetails cart={cart} />
      </div>
      <div className="order-summary-wrap">
        <Summary cart={cart} />
      </div>
    </div>
  )
}

export default Order

require('react-styl')(`
  .checkout
    display: flex
    h3,h4,h5
      font-weight: 400
    .breadcrumbs
      font-size: 0.8rem
      a
        color: #1990c6
    > .user-details
      flex: 7
      padding: 3rem
      display: flex
      justify-content: flex-end
      .checkout-information,.checkout-shipping
        padding: 1rem
        max-width: 600px
        width: 100%
      .actions
        display: flex
        justify-content: space-between
        align-items: center
        margin-top: 2rem
    > .order-summary-wrap
      padding: 3rem
      flex: 6
      min-height: 100vh
      border-width: 0 0 0 1px
      border-style: solid
      border-color: #ddd
      background: #f6f6f6


  @media (max-width: 767.98px)
    .checkout
      flex-direction: column
      > .user-details
        padding: 1rem
        order: 2
        .checkout-information,.checkout-shipping
          padding: 1rem 0
        .actions
          flex-direction: column-reverse
          *
            margin-bottom: 2rem
      > .order-summary-wrap
        padding: 1rem 1.25rem
        border-width: 1px 0 1px 0
        min-height: 0
        .toggle-order-summary
          display: flex
          justify-content: space-between
          .toggle
            color: #1990c6
          .icon-caret
            fill: #1990c6
            margin-left: 0.5rem
          .icon-cart
            margin-right: 0.5rem
            width: 1.5rem
          &.active
            .icon-caret
              transform: scaleY(-1)

        .order-summary
          margin-top: 2rem
          display: none
          &.show
            display: block

`)

require('react-styl')(`
  .order-summary
    max-width: 430px
    .item
      display: flex
      align-items: center
      margin-bottom: 1rem
      width: 100%
      .title
        font-weight: bold
        flex: 1
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
    .sub-total,.total
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

require('react-styl')(`
  .checkout-confirmation
    width: 100%
    max-width: 570px
    .icon-check-circle
      width: 3rem
    .thankyou
      display: flex
      align-items: center
      margin-top: 1rem
      .check
        margin-right: 1rem
      .order-number
        font-size: 0.875rem
        color: #666
      .name
        font-size: 1.25rem
    .order-confirmed
      margin-top: 2rem
      border: 1px solid #ddd
      border-radius: 0.25rem
      padding: 1rem
      .title
        font-size: 1.25rem
        margin-bottom: 0.25rem
      .description
        color: #666
    .customer-info
      margin-top: 2rem
      border: 1px solid #ddd
      border-radius: 0.25rem
      padding: 1rem
      font-size: 0.875rem
      color: #555
      h4
        font-size: 1.125rem
        color: #333
        margin-bottom: 0.25rem
      h5
        font-size: 0.875rem
        margin-top: 1rem
        font-weight: 500
        color: #333

`)
