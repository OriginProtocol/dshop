import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import useThemeVars from 'utils/useThemeVars'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import CartIcon from 'components/icons/Cart'
import Link from 'components/Link'
import SocialLinks from 'components/SocialLinks'
import MenuIcon from 'components/icons/Menu'

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
  const { config } = useConfig()
  const [{ cart }] = useStateValue()
  const themeVars = useThemeVars()
  const [mobileMenu, showMobileMenu] = useState(false)

  function toggleMobileMenu() {
    const body = document.querySelector('body')
    if (mobileMenu) {
      body.style.removeProperty('overflow')
    } else {
      body.style.overflow = 'hidden'
    }
    showMobileMenu(!mobileMenu)
  }

  const relativeLogoPath = get(themeVars, 'header.logo.0.url')
  const logoText = get(themeVars, 'header.logoText')
  const logoUrl = `${config.dataSrc}${relativeLogoPath}`

  return (
    <div className="container flex items-center pt-8 sm:pt-20">
      <Link to="/" className="flex items-center font-bold">
        {relativeLogoPath ? (
          <>
            <img className="mr-2 w-8 h-8 sm:w-16 sm:h-16" src={logoUrl} />
            {logoText ? (
              <div className="sm:text-3xl text-xl font-normal">{logoText}</div>
            ) : null}
          </>
        ) : (
          <div className="sm:text-3xl text-xl">{config.title}</div>
        )}
      </Link>
      <div className="ml-auto grid grid-flow-col gap-4 sm:gap-12 items-center">
        <div className="hidden sm:block">
          <Link to="/products" className="hover:opacity-75">
            Products
          </Link>
        </div>
        <div className="hidden sm:block">
          <Link to="/about" className="hover:opacity-75">
            About
          </Link>
        </div>
        <SocialLinks
          itemClassName="hidden sm:block hover:opacity-75"
          svg={{ color: '#fff', width: 20, height: 20 }}
          contentOnly
        />
        <a
          className="sm:hidden"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            toggleMobileMenu()
          }}
        >
          <MenuIcon color="#fff" />
        </a>
        <div className="hover:opacity-75">
          <Cart cart={cart} />
        </div>
      </div>
      {mobileMenu && <MobileMenu toggleMobileMenu={toggleMobileMenu} />}
    </div>
  )
}

const MobileMenu = ({ toggleMobileMenu }) => {
  const [{ cart }] = useStateValue()
  const { config } = useConfig()
  const history = useHistory()
  const themeVars = useThemeVars()
  const relativeLogoPath = get(themeVars, 'header.logo.0.url')
  const logoUrl = `${config.dataSrc}${relativeLogoPath}`
  return (
    <div
      className="fixed inset-0 bg-black px-6 pt-8 pb-12 flex flex-col items-center text-white z-10"
      onClick={() => toggleMobileMenu()}
    >
      <div className="flex justify-between items-center w-full">
        <Close />
        {relativeLogoPath ? (
          <img className="w-8 h-8 sm:w-16 sm:h-16" src={logoUrl} />
        ) : (
          <>Galleria</>
        )}
        <Cart cart={cart} bg={true} />
      </div>
      <div className="text-3xl font-medium mt-12 text-center">
        <div
          className="pb-8"
          onClick={() => {
            toggleMobileMenu()
            history.push('/products')
          }}
        >
          Products
        </div>
        <div
          className="pb-8"
          onClick={() => {
            toggleMobileMenu()
            history.push('/about')
          }}
        >
          About
        </div>
      </div>
      <div className="mt-auto">
        <SocialLinks
          itemClassName="hidden sm:inline-block hover:opacity-75"
          svg={{ color: '#fff', width: 20, height: 20 }}
          contentOnly
        />
      </div>
    </div>
  )
}

const Close = () => (
  <svg width="18" height="18">
    <line x1="1" y1="17" x2="17" y2="1" strokeWidth="4" stroke="#fff" />
    <line x1="1" y1="1" x2="17" y2="17" strokeWidth="4" stroke="#fff" />
  </svg>
)

export default Header
