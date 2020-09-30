import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'

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

const MobileMenu = ({ toggleMobileMenu }) => {
  const [{ cart }] = useStateValue()
  const { config } = useConfig()
  const history = useHistory()
  return (
    <div
      className="fixed inset-0 bg-black px-6 pt-2 pb-12 flex flex-col items-center text-white"
      onClick={() => toggleMobileMenu()}
    >
      <div className="flex justify-between items-center w-full">
        <Close />
        <img src="ybm/YBM Black trans.PNG" style={{ width: 100 }} />
        <Cart cart={cart} bg={true} />
      </div>
      <div className="text-3xl font-medium mt-12 text-center">
        <div
          className="pb-4"
          onClick={() => {
            toggleMobileMenu()
            history.push('/products')
          }}
        >
          Products
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
          color="#fff"
          iconStyle={{ height: 18 }}
          iconClass="inline-block"
        />
        <SocialLink
          href={config.facebook}
          color="#fff"
          iconStyle={{ height: 18 }}
          iconClass="ml-6 inline-block"
        />
        <SocialLink
          href={config.instagram}
          color="#fff"
          iconStyle={{ height: 18 }}
          iconClass="ml-6 inline-block"
        />
      </div>
    </div>
  )
}

const HeaderMobile = ({ style, children }) => {
  if (!children) {
    return <MobileLinks>{children}</MobileLinks>
  }
  return (
    <div
      className="text-white bg-cover bg-no-repeat bg-black font-light"
      style={style || defaultStyle}
    >
      <div style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <MobileLinks>{children}</MobileLinks>
      </div>
    </div>
  )
}

const MobileLinks = ({ children }) => {
  const [mobileMenu, showMobileMenu] = useState(false)
  const [{ cart }] = useStateValue()
  function toggleMobileMenu() {
    const body = document.querySelector('body')
    if (mobileMenu) {
      body.style.removeProperty('overflow')
    } else {
      body.style.overflow = 'hidden'
    }
    showMobileMenu(!mobileMenu)
  }
  return (
    <>
      <div className="container flex pt-2 items-center justify-between">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            toggleMobileMenu()
          }}
        >
          <MenuIcon color={children ? '#fff' : '#000'} />
        </a>
        <Link to="/">
          <img src="ybm/YBM Black trans.PNG" style={{ width: 100 }} />
        </Link>
        <Cart cart={cart} bg={children ? true : false} />
      </div>
      {children}
      {mobileMenu && <MobileMenu toggleMobileMenu={toggleMobileMenu} />}
    </>
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

const Close = () => (
  <svg width="18" height="18">
    <line x1="1" y1="17" x2="17" y2="1" strokeWidth="4" stroke="#fff" />
    <line x1="1" y1="1" x2="17" y2="17" strokeWidth="4" stroke="#fff" />
  </svg>
)

export default Header
