import React from 'react'

import Twitter from 'components/icons/Twitter'
import Facebook from 'components/icons/Facebook'
import YouTube from 'components/icons/YouTube'
import CartIcon from 'components/icons/Cart'
import Link from 'components/Link'
import MenuIcon from 'components/icons/Menu'

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
  return (
    <div className="container grid items-center pt-6 sm:pt-20 grid-cols-3">
      <div className="flex">
        <div className="hidden sm:block">
          <Twitter color="#fff" style={{ width: 20 }} />
        </div>
        <div className="hidden sm:block ml-10">
          <Facebook color="#fff" style={{ width: 12 }} />
        </div>
        <div className="hidden sm:block ml-10">
          <YouTube color="#fff" style={{ width: 20 }} />
        </div>
      </div>
      <Link to="/" className="flex items-center justify-center">
        <img src={`${config.dataSrc}${config.logo}`} style={{ height: 80 }} />
      </Link>
      <div className="flex text-sm justify-end">
        <div className="flex py-1 px-3 bg-gray-800 rounded-full">
          <img
            src="images/fire-icon.svg"
            width="12"
            height="12"
            className="mr-2"
          />
          123 redeemed
        </div>
        <div className="flex py-1 px-3 bg-gray-800 rounded-full ml-4 items-center">
          <svg height="12" width="12" className="mr-2">
            <circle cx="6" cy="6" r="6" fill="#26d198" />
          </svg>
          0x3b22...
        </div>
      </div>
    </div>
  )
}

export default Header
