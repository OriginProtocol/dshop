import React from 'react'
import get from 'lodash/get'
import Twitter from 'components/icons/Twitter'
import Facebook from 'components/icons/Facebook'
import YouTube from 'components/icons/YouTube'
import CartIcon from 'components/icons/Cart'
import Link from 'components/Link'
import MenuIcon from 'components/icons/Menu'
import useThemeVars from 'utils/useThemeVars'
import useConfig from 'utils/useConfig'
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
  const { config } = useConfig()
  const [{ cart }] = useStateValue()
  const themeVars = useThemeVars()

  const relativeLogoPath = get(themeVars, 'header.logo.0.url')
  const logoUrl = `${config.dataSrc}${relativeLogoPath}`

  return (
    <div className="container flex items-center pt-8 sm:pt-20">
      <Link to="/" className="flex items-center font-bold">
        {relativeLogoPath ? (
          <img
            style={{ transform: 'translateY(-3px)' }}
            className="mr-2 w-8 h-8 sm:w-16 sm:h-16"
            src={logoUrl}
          />
        ) : (
          <div className="sm:text-3xl text-xl">{config.title}</div>
        )}
      </Link>
      <div className="ml-auto grid grid-flow-col gap-4 sm:gap-12 items-center">
        <div className="hidden sm:block">
          <Link to="/">Products</Link>
        </div>
        <div className="hidden sm:block">
          <Link to="/about">About</Link>
        </div>
        <div className="hidden sm:block">
          <Twitter color="#fff" style={{ width: 20 }} />
        </div>
        <div className="hidden sm:block">
          <Facebook color="#fff" style={{ width: 12 }} />
        </div>
        <div className="hidden sm:block">
          <YouTube color="#fff" style={{ width: 20 }} />
        </div>
        <a
          className="sm:hidden"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            // toggleMobileMenu()
          }}
        >
          <MenuIcon color="#fff" />
        </a>
        <div>
          <Cart cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default Header
