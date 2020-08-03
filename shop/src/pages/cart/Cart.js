import React from 'react'

import Link from 'components/Link'
import formatPrice from 'utils/formatPrice'
import useIsMobile from 'utils/useIsMobile'

import CartItem from './CartItem'

import { useStateValue } from 'data/state'

const CartItems = () => {
  const [{ cart, config }, dispatch] = useStateValue()
  const isMobile = useIsMobile()
  const lg = isMobile ? ' btn-lg' : ''

  return (
    <>
      <div className="items">
        <div className="th pic">Product</div>
        <div className="th title" />
        <div className="th price">Price</div>
        <div className="th quantity">Quantity</div>
        <div className="th total">Total</div>
        {cart.items.map((item) => (
          <CartItem key={`${item.product}-${item.variant}`} item={item} />
        ))}
      </div>
      <div className="row mt-4">
        <div className="col-md-6 order-1 order-md-0">
          Special instructions for seller
          <textarea
            rows="5"
            className="form-control"
            value={cart.instructions}
            onChange={(e) => {
              dispatch({ type: 'updateInstructions', value: e.target.value })
            }}
          />
        </div>
        <div className="col-md-6 text-right mb-4">
          <div className="mb-2">
            <b>{`Subtotal ${formatPrice(cart.subTotal, {
              currency: config.currency
            })}`}</b>
          </div>
          <div>
            <i>Shipping & taxes calculated at checkout</i>
          </div>
          <div className="actions">
            <Link to="/" className={`btn btn-outline-primary${lg}`}>
              Continue Shopping
            </Link>
            <Link to="/checkout" className={`btn btn-primary${lg}`}>
              Check Out
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

const Cart = () => {
  const [{ cart }] = useStateValue()

  return (
    <div className="cart">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <span>Your Shopping Cart</span>
      </div>
      {cart.items.length ? (
        <CartItems />
      ) : (
        <div>
          <h3>Shopping Cart</h3>
          <p>Your cart is currently empty.</p>

          <p>
            Continue browsing <Link to="/">here</Link>.
          </p>
        </div>
      )}
    </div>
  )
}

export default Cart

require('react-styl')(`
  .cart
    border-top: 1px solid #eee
    padding-top: 1.5rem
    img
      width: 100%
    .items
      display: grid
      grid-template-columns: 1fr 3fr 5rem 4rem 5rem
      grid-column-gap: 1.5rem
      grid-row-gap: 1.5rem
      align-items: center
      > .th
        font-weight: bold
    .actions
      margin-top: 1rem
      .btn
        margin-left: 0.5rem
  .cart-options
    margin-top: 0.25rem
    font-size: 0.8rem
    > span
      &:after
        content: "/"
        padding: 0 0.25rem
      &:last-child:after
        content: ""
  @media (max-width: 767.98px)
    .cart
      .actions
        display: flex
        flex-direction: column-reverse
        .btn
          margin: 0 0 0.5rem 0
      .items
        grid-template-columns: 1fr
        text-align: center
        .th
          display: none !important
        .price
          display: flex
          justify-content: space-between
          &:before
            content: "Price"
        .quantity
          display: flex
          align-items: center
          justify-content: space-between
          .form-control
            width: auto
          &:before
            content: "Quantity"
        .total
          display: flex
          justify-content: space-between
          border-bottom: 1px solid #eee
          padding-bottom: 2rem
          &:before
            content: "Total"

`)
