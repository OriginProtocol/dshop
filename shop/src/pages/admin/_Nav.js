import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import fbt from 'fbt'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useAuth from 'utils/useAuth'

import SwitchToStorefront from 'components/SwitchToStorefront'
import Redirect from 'components/Redirect'
import PreviewBanner from 'components/PreviewBanner'
import AccountSelector from './_AccountSelector'
import User from './_User'
import NewShop from './_NewShop'
import LiveChat from './_LiveChat'

const Nav = ({ newShop, setNewShop, only }) => {
  const [{ admin }] = useStateValue()
  const location = useLocation()
  const history = useHistory()

  const { config, setActiveShop } = useConfig()

  useAuth({ only })
  if (!localStorage.isAdmin || !admin) {
    return null
  }

  const isSuperAdmin = location.pathname.indexOf('/super-admin') === 0
  const isAdmin = location.pathname.indexOf('/admin') === 0 || isSuperAdmin

  if (!config.activeShop && !isAdmin) {
    return <Redirect to="/admin" />
  }

  if (window.name === 'shop_preview') {
    // Hide admin nav on preview
    return <PreviewBanner />
  }

  return (
    <nav className="admin-nav">
      <div className="fullwidth-container">
        <h1>
          <img
            className="dshop-logo"
            src="images/dshop-logo-blue.svg"
            onClick={() => {
              setActiveShop()
              history.push('/admin')
            }}
          />
          <AccountSelector
            superAdmin={isSuperAdmin}
            onNewShop={setNewShop ? () => setNewShop(true) : null}
          />
        </h1>
        {!config.activeShop ? null : (
          <div className="btn-group btn-group-sm mx-auto admin-switcher">
            <SwitchToStorefront
              className="btn btn-sm btn-outline-primary px-4"
              children={<fbt desc="Preview Shop">Preview Shop</fbt>}
            />
          </div>
        )}
        <LiveChat className="ml-auto" />
        <User className="ml-4" />
      </div>
      <NewShop shouldShow={newShop} onClose={() => setNewShop(false)} />
    </nav>
  )
}

export default Nav

require('react-styl')(`
  nav.admin-nav
    border-bottom: 1px solid #dfe2e6
    color: #000
    .admin-switcher
      position: absolute
      left: 50%
      transform: translateX(-50%)
    > .fullwidth-container
      display: flex
      align-items: center
      justify-content: between
      flex-wrap: wrap
      min-height: 4.5rem
    h1
      margin: 0
      display: flex
      font-size: 1rem
      img
        max-height: 2.5rem
        max-width: 12rem
        &.dshop-logo
          transform: translateY(3.5px)
      .shops-title-wrapper
        display: flex
      .shop-title
        display: flex
        align-items: center
        margin-left: 1rem
        padding-left: 1rem
        border-left: 1px solid #5666
        position: relative
        cursor: pointer
      .dropdown-cog
        width: 16px
        height: 16px
        margin-left: 10px

`)
