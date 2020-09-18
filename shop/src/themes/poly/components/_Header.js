import React from 'react'

import Twitter from 'components/icons/Twitter'
import Facebook from 'components/icons/Facebook'
import YouTube from 'components/icons/YouTube'
import CartIcon from 'components/icons/Cart'
import Link from 'components/Link'

import { useStateValue } from 'data/state'

const Cart = ({ cart }) => (
  <Link to="/cart" className="nav-link relative flex">
    <CartIcon style={{ width: 25 }} fill="#fff" />
    {cart.items.length ? (
      <div className="absolute text-xs" style={{ top: -10, right: -10 }}>
        {cart.items.length}
      </div>
    ) : null}
  </Link>
)

const Header = () => {
  const [{ cart }] = useStateValue()
  return (
    <div className="flex items-center">
      <Link to="/" className="flex items-center">
        <img
          style={{ width: 60, transform: 'translateY(-3px)' }}
          className="mr-2"
          src="low-poly-mint/Symbol Transparent Background0.png"
        />
        <div className="text-3xl">Low Poly Mint</div>
      </Link>
      <div className="ml-auto grid grid-flow-col gap-12 items-center">
        <div>
          <Link to="/">Products</Link>
        </div>
        <div>
          <Link to="/about">About</Link>
        </div>
        <div>
          <Twitter color="#fff" style={{ width: 20 }} />
        </div>
        <div>
          <Facebook color="#fff" style={{ width: 12 }} />
        </div>
        <div>
          <YouTube color="#fff" style={{ width: 20 }} />
        </div>
        <div>
          <Cart cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default Header
