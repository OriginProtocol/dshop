import React, { useState } from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'

import { useStateValue } from 'data/state'

import Link from 'components/Link'
import CartIcon from 'components/icons/Cart'
// import MenuIcon from 'components/icons/Menu'

const Cart = ({ cart }) => (
  <Link to="/cart" className="btn btn-primary nav-link flex text-sm px-6 py-1">
    <CartIcon className="w-4 mr-3" fill="#fff" />
    Cart
    {cart.items.length ? <div>{cart.items.length}</div> : null}
  </Link>
)

const Header = ({ bg }) => {
  const history = useHistory()
  const [mobileMenu, showMobileMenu] = useState(false)
  const [{ cart }] = useStateValue()
  const about = useRouteMatch('/about')
  const product = useRouteMatch('/product') || useRouteMatch('/products')

  const content = (
    <div className="container flex flex-row justify-between items-center">
      <Link to="/">
        <img
          style={{ width: 120 }}
          src="bite-desserts/cropped-BiteDessertsLogoTransparente (2).png"
        />
      </Link>
      <div className="flex flex-row text-sm items-center">
        <Link
          className={`hidden md:block mr-8 pb-1 ${
            about ? ' border-b border-black' : ''
          }`}
          to="/about"
        >
          About
        </Link>
        <Link
          className={`hidden md:block mr-8 pb-1 ${
            product ? ' border-b border-black' : ''
          }`}
          to="/products"
        >
          All Products
        </Link>
        <Link
          className={`hidden md:block mr-8 pb-1 ${
            product ? ' border-b border-black' : ''
          }`}
          to="/products"
        >
          Cupcakes
        </Link>

        <Link
          className={`hidden md:block pb-1 ${
            product ? ' border-b border-black' : ''
          }`}
          to="/products"
        >
          Cakes
        </Link>
      </div>
      <div className="flex">
        <Cart cart={cart} bg={bg} />
      </div>
    </div>
  )

  return (
    <>
      <div className="py-12 sm:py-20">{content}</div>
      {!mobileMenu ? null : (
        <div
          className="fixed inset-0 bg-white p-12"
          onClick={() => showMobileMenu(false)}
        >
          <div className="flex justify-between items-center">
            <Close />
            <div className="text-2xl font-medium">The Peer Art</div>
            <Cart cart={cart} />
          </div>
          <ul className="flex flex-col text-3xl items-center font-medium mt-12">
            <li
              className="pb-4"
              onClick={() => {
                showMobileMenu(false)
                history.push('/products')
              }}
            >
              All Prints
            </li>
            <li
              className="pb-4"
              onClick={() => {
                showMobileMenu(false)
                history.push('/about')
              }}
            >
              About
            </li>
            <li
              className="pb-4"
              onClick={() => {
                showMobileMenu(false)
                history.push('/contact')
              }}
            >
              Contact
            </li>
          </ul>
        </div>
      )}
    </>
  )
}

const Close = () => (
  <svg width="18" height="18">
    <line x1="1" y1="17" x2="17" y2="1" strokeWidth="4" stroke="#000" />
    <line x1="1" y1="1" x2="17" y2="17" strokeWidth="4" stroke="#000" />
  </svg>
)

export default Header
