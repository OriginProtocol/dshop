import React from 'react'

import useConfig from 'utils/useConfig'
import useIsMobile from 'utils/useIsMobile'
import { useStateValue } from 'data/state'

import SocialLink from 'components/SocialLink'
import CartIcon from 'components/icons/Cart'
import MenuIcon from 'components/icons/Menu'
import Link from 'components/Link'

const Header = ({ children, ...props }) => {
  const isMobile = useIsMobile()
  const Cmp = isMobile ? HeaderMobile : HeaderDesktop
  return <Cmp {...props}>{children}</Cmp>
}
const defaultStyle = {
  backgroundImage: 'url(ybm/header.jpg)',
  backgroundPosition: 'center 70%'
}

const HeaderMobile = ({ style }) => {
  const [{ cart }] = useStateValue()
  return (
    <div
      className="text-white bg-cover bg-no-repeat bg-black font-light"
      style={style || defaultStyle}
    >
      <div style={{ minHeight: '600px', backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="container flex pt-2 items-center justify-between">
          <MenuIcon color="#fff" />
          <img src="ybm/YBM Black trans.PNG" style={{ width: 100 }} />
          <Cart cart={cart} />
        </div>
        <div className="text-center mt-32 text-3xl sm:text-5xl leading-tight">
          High-quality merch from Atlanta, Georgia since 2017
        </div>
        <div className="text-center mt-12">
          <Link to="/products" className="btn btn-primary btn-xl">
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  )
}

const HeaderDesktop = ({ children, style }) => {
  if (!children) {
    return <DesktopLinks bg={children} />
  }
  return (
    <div
      className="text-white bg-cover bg-no-repeat bg-black font-light"
      style={style || defaultStyle}
    >
      <div style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <DesktopLinks bg={children} />
        {children}
      </div>
    </div>
  )
}

const DesktopLinks = ({ bg }) => {
  const { config } = useConfig()
  const [{ cart }] = useStateValue()
  return (
    <div className="container flex pt-12 items-center">
      <div className="flex-1 flex gap-10 text-sm ">
        <Link to="/products">Products</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <Link to="/">
        <img src="ybm/YBM Black trans.PNG" style={{ height: 120 }} />
      </Link>
      <div className="flex-1 flex justify-end gap-8 items-center">
        <SocialLink
          color={bg ? '#fff' : '#000'}
          href={config.facebook}
          iconStyle={{ height: '18' }}
        />
        <SocialLink
          color={bg ? '#fff' : '#000'}
          href={config.twitter}
          iconStyle={{ height: '18' }}
        />
        <SocialLink
          color={bg ? '#fff' : '#000'}
          href={config.instagram}
          iconStyle={{ height: '18' }}
        />
        <Cart cart={cart} bg={bg} />
      </div>
    </div>
  )
}

const Cart = ({ cart, bg }) => (
  <Link to="/cart" className="nav-link relative flex">
    <CartIcon style={{ width: 25 }} fill={bg ? '#fff' : '#000'} />
    {cart.items.length ? (
      <div className="absolute text-xs" style={{ top: -10, right: -10 }}>
        {cart.items.length}
      </div>
    ) : null}
  </Link>
)

export default Header
