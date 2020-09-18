import React, { useState } from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'

import { useStateValue } from 'data/state'

import Link from 'components/Link'
import CartIcon from 'components/icons/Cart'
import MenuIcon from 'components/icons/Menu'

const Cart = ({ cart, bg }) => (
  <Link to="/cart" className="nav-link relative">
    <CartIcon className="w-5" fill={bg ? '#fff' : '#000'} />
    {cart.items.length ? (
      <div className="absolute text-xs" style={{ top: -10, right: -10 }}>
        {cart.items.length}
      </div>
    ) : null}
  </Link>
)

const Header = ({ bg }) => {
  const history = useHistory()
  const [mobileMenu, showMobileMenu] = useState(false)
  const [{ cart }] = useStateValue()
  const about = useRouteMatch('/about')
  const product = useRouteMatch('/product') || useRouteMatch('/products')
  const contact = useRouteMatch('/contact')

  const content = (
    <div className="container flex flex-row justify-between items-center sm:items-baseline">
      <Link to="/" className="text-2xl">
        The Peer Art
      </Link>
      <ul className="flex flex-row text-sm">
        <li
          className={`hidden md:block mr-12 pb-1 ${
            product ? ' border-b border-black' : ''
          }`}
        >
          <Link to="/products">All Prints</Link>
        </li>
        <li
          className={`hidden md:block mr-12 pb-1 ${
            about ? ' border-b border-black' : ''
          }`}
        >
          <Link to="/about">About</Link>
        </li>
        <li
          className={`hidden md:block mr-12 pb-1 ${
            contact ? ' border-b border-black' : ''
          }`}
        >
          <Link to="/contact">Contact</Link>
        </li>
        <li className="sm:hidden mr-6">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              showMobileMenu(!mobileMenu)
            }}
          >
            <MenuIcon color={bg ? '#fff' : '#000'} />
          </a>
        </li>
        <li className="sm:pb-1 flex">
          <Cart cart={cart} bg={bg} />
        </li>
      </ul>
    </div>
  )

  const className = bg
    ? 'text-white pt-12 sm:pt-24 pb-64 bg-cover'
    : 'py-12 sm:py-24'
  const backgroundImage =
    bg &&
    `url(peer-art/rain-ruffles/520/upload_964813380263770ea62915a5edeede87)`

  return (
    <>
      <div className={className} style={{ backgroundImage }}>
        {content}
      </div>
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
