import React, { useState } from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useCollections from 'utils/useCollections'
import useThemeVars from 'utils/useThemeVars'

import Link from 'components/Link'
import CartIcon from 'components/icons/Cart'
import MenuIcon from 'components/icons/Menu'

import SocialLinks from 'components/SocialLinks'

const Cart = ({ cart, bg }) => (
  <Link to="/cart" className="nav-link relative hover:opacity-50">
    <CartIcon
      className={`w-5 fill-current ${bg ? 'text-white' : 'text-black'}`}
      fill={null}
    />
    {cart.items.length ? (
      <div
        className={`absolute text-xs ${bg ? 'text-white' : 'text-black'}`}
        style={{ top: -10, right: -10 }}
      >
        {cart.items.length}
      </div>
    ) : null}
  </Link>
)

const Header = () => {
  const history = useHistory()
  const { collections } = useCollections()
  const [mobileMenu, showMobileMenu] = useState(false)
  const { config } = useConfig()
  const [{ cart }] = useStateValue()
  const isHome = useRouteMatch({ path: '/', exact: true })
  const about = useRouteMatch('/about')
  const product = useRouteMatch('/product') || useRouteMatch('/products')
  const contact = useRouteMatch('/contact')

  const themeVars = useThemeVars()

  const bgImageRelUrl = get(themeVars, 'home.headerImage.0.url')

  const backgroundImage =
    isHome && bgImageRelUrl && `url(${config.dataSrc}${bgImageRelUrl})`

  const bg = isHome && bgImageRelUrl

  const activeClass = ` border-b ${bg ? 'border-white' : 'border-link'}`

  function toggleMobileMenu() {
    const body = document.querySelector('body')
    if (mobileMenu) {
      body.style.removeProperty('overflow')
    } else {
      body.style.overflow = 'hidden'
    }
    showMobileMenu(!mobileMenu)
  }

  const content = (
    <div className="container flex flex-row justify-between items-center sm:items-baseline">
      <Link
        to="/"
        className={`text-2xl font-header ${bg ? 'text-white' : 'text-black'}`}
      >
        {config.title}
      </Link>
      <div className="flex flex-row text-sm">
        <Link
          to="/products"
          className={`hidden md:block mr-12 pb-1 ${
            product ? activeClass : ''
          } hover:opacity-50 ${bg ? 'text-white' : 'text-link'}`}
        >
          {get(collections, '0.title')}
        </Link>
        <Link
          to="/about"
          className={`hidden md:block mr-12 pb-1 ${
            about ? activeClass : ''
          } hover:opacity-50 ${bg ? 'text-white' : 'text-link'}`}
        >
          About
        </Link>
        <Link
          to="/contact"
          className={`hidden md:block mr-12 pb-1 ${
            contact ? activeClass : ''
          } hover:opacity-50 ${bg ? 'text-white' : 'text-link'}`}
        >
          Contact
        </Link>
        <a
          className="sm:hidden mr-6"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            toggleMobileMenu()
          }}
        >
          <MenuIcon color={bg ? '#fff' : '#000'} />
        </a>
        <SocialLinks
          itemsClassName="hidden md:block mx-3 flex items-center hover:opacity-50"
          svg={{
            height: 18,
            className: `inline-block mr-6 fill-current ${
              bg ? 'text-white' : 'text-black'
            }`
          }}
          contentOnly
        />
        <div className="sm:pb-1 flex">
          <Cart cart={cart} bg={bg} />
        </div>
      </div>
    </div>
  )

  const className = bg
    ? 'text-white pt-12 sm:pt-24 pb-64 bg-cover'
    : 'py-12 sm:py-24'

  return (
    <>
      <div className={className} style={{ backgroundImage }}>
        {content}
      </div>
      {!mobileMenu ? null : (
        <div
          className="fixed inset-0 bg-white p-12 flex flex-col items-center"
          onClick={() => toggleMobileMenu()}
        >
          <div className="flex justify-between items-center w-full">
            <Close />
            <div className="text-2xl font-medium">{config.title}</div>
            <Cart cart={cart} />
          </div>
          <div className="text-3xl font-medium mt-12 text-center">
            <div
              className="pb-4"
              onClick={() => {
                toggleMobileMenu()
                history.push('/products')
              }}
            >
              {get(collections, '0.title')}
            </div>
            <div
              className="pb-4"
              onClick={() => {
                toggleMobileMenu()
                history.push('/about')
              }}
            >
              About
            </div>
            <div
              className="pb-4"
              onClick={() => {
                toggleMobileMenu()
                history.push('/contact')
              }}
            >
              Contact
            </div>
          </div>
          <div className="mt-auto">
            <SocialLinks
              svg={{ height: 18, className: 'inline-block' }}
              contentOnly
            />
          </div>
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
