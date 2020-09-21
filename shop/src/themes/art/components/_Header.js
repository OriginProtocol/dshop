import React, { useState } from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useCollections from 'utils/useCollections'

import Link from 'components/Link'
import CartIcon from 'components/icons/Cart'
import MenuIcon from 'components/icons/Menu'

import SocialLink from './_SocialLink'

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
  const { collections } = useCollections()
  const [mobileMenu, showMobileMenu] = useState(false)
  const { config } = useConfig()
  const [{ cart }] = useStateValue()
  const about = useRouteMatch('/about')
  const product = useRouteMatch('/product') || useRouteMatch('/products')
  const contact = useRouteMatch('/contact')

  const activeClass = ' border-b border-black'

  const Social = ({ href, height = 16 }) => (
    <SocialLink
      className="hidden md:block mr-12 flex items-center"
      color={bg ? '#fff' : '#000'}
      href={href}
      iconStyle={{ height }}
      iconClass="inline-block"
    />
  )

  const content = (
    <div className="container flex flex-row justify-between items-center sm:items-baseline">
      <Link to="/" className="text-2xl">
        {config.title}
      </Link>
      <div className="flex flex-row text-sm">
        <Link
          to="/products"
          className={`hidden md:block mr-12 pb-1 ${product ? activeClass : ''}`}
        >
          {get(collections, '0.title')}
        </Link>
        <Link
          to="/about"
          className={`hidden md:block mr-12 pb-1 ${about ? activeClass : ''}`}
        >
          About
        </Link>
        <Link
          to="/contact"
          className={`hidden md:block mr-12 pb-1 ${contact ? activeClass : ''}`}
        >
          Contact
        </Link>
        <a
          className="sm:hidden mr-6"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            showMobileMenu(!mobileMenu)
          }}
        >
          <MenuIcon color={bg ? '#fff' : '#000'} />
        </a>
        <Social href={config.twitter} height="18" />
        <Social href={config.facebook} />
        <Social href={config.instagram} />
        <div className="sm:pb-1 flex">
          <Cart cart={cart} bg={bg} />
        </div>
      </div>
    </div>
  )

  const className = bg
    ? 'text-white pt-12 sm:pt-24 pb-64 bg-cover'
    : 'py-12 sm:py-24'

  const backgroundImage =
    bg && `url(${config.dataSrc}${get(config, 'theme.home.backgroundImage')})`

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
            <div className="text-2xl font-medium">{config.title}</div>
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
              {get(collections, '0.title')}
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
