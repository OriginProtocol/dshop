import React from 'react'
import fbt from 'fbt'
import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

import Link from 'components/Link'
import CartIcon from 'components/icons/Cart'
import Search from './_Search'
import AffiliateNav from './affiliates/NavBar'

const Nav = () => {
  const [{ cart, affiliate }] = useStateValue()
  const { config } = useConfig()
  if (config.singleProduct) {
    return <div className="nav-border" />
  }

  const noBorder = affiliate || config.notice || localStorage.isAdmin

  return (
    <>
      <AffiliateNav />
      <nav
        className={`navbar navbar-expand-md${noBorder ? ' border-top-0' : ''}`}
      >
        <div className="container bb">
          <form className="form-inline" onSubmit={(e) => e.preventDefault()}>
            <Search />
          </form>
          <button className="navbar-toggler">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ml-auto">
              <li className="nav-item">
                <Link to="/cart" className="nav-link">
                  <CartIcon />
                  <fbt desc="Cart">Cart</fbt>
                  {`${cart.items.length ? ` (${cart.items.length})` : ''}`}
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to={cart.items.length ? '/checkout' : '/cart'}
                >
                  <fbt desc="CheckOut">Check Out</fbt>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Nav

require('react-styl')(`
  .navbar,.nav-border
    border-top: 5px solid black
  .navbar > .container
    position: relative
    &.bb::after
      content: ""
      border-bottom: 1px solid #eee
      position: absolute
      left: 1rem
      right: 1rem
      bottom: -0.5rem
    .nav-link
      display: flex
      svg
        width: 1.25rem
        height: 1.5rem
        margin-right: 0.5rem
`)
