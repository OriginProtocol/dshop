import React, { useState } from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useCollections from 'utils/useCollections'

import Link from 'components/Link'
import CartIcon from 'components/icons/Cart'
import MenuIcon from 'components/icons/Menu'

import SocialLink from 'components/SocialLink'

const Cart = ({ cart, bg }) => (
  <Link to="/cart" className="nav-link relative hover:opacity-50">
    <CartIcon className="w-5" fill={bg ? '#fff' : '#000'} />
    {cart.items.length ? (
      <div className="absolute text-xs" style={{ top: -10, right: -10 }}>
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
  const bg = useRouteMatch({ path: '/', exact: true })
  const about = useRouteMatch('/about')
  const product = useRouteMatch('/product') || useRouteMatch('/products')
  const contact = useRouteMatch('/contact')

  const activeClass = ' border-b border-black'

  const Social = ({ href, height = 16 }) => (
    <SocialLink
      className="hidden md:block mr-12 flex items-center hover:opacity-50"
      href={href}
      svg={{ className: 'inline-block', height, color: bg ? '#fff' : '#000' }}
    />
  )

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
      <Link to="/" className="text-2xl">
        {config.title}
      </Link>
      <div className="flex flex-row text-sm">
        <Link
          to="/products"
          className={`hidden md:block mr-12 pb-1 ${
            product ? activeClass : ''
          } hover:opacity-50`}
        >
          {get(collections, '0.title')}
        </Link>
        <Link
          to="/about"
          className={`hidden md:block mr-12 pb-1 ${
            about ? activeClass : ''
          } hover:opacity-50`}
        >
          About
        </Link>
        <Link
          to="/contact"
          className={`hidden md:block mr-12 pb-1 ${
            contact ? activeClass : ''
          } hover:opacity-50`}
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
            <SocialLink
              href={config.twitter}
              svg={{ height: 18, className: 'inline-block' }}
            />
            <SocialLink
              href={config.facebook}
              svg={{ height: 18, className: 'ml-6 inline-block' }}
            />
            <SocialLink
              href={config.instagram}
              svg={{ height: 18, className: 'ml-6 inline-block' }}
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
