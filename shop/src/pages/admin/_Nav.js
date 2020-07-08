import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useAuth from 'utils/useAuth'

import AccountSelector from './_AccountSelector'
import User from './_User'
import NewShop from './_NewShop'

const Nav = ({ newShop, setNewShop }) => {
  const [
    { admin, storefrontLocation, adminLocation },
    dispatch
  ] = useStateValue()
  const location = useLocation()
  const history = useHistory()
  const { config, setActiveShop } = useConfig()
  useAuth({ only: () => localStorage.isAdmin })
  if (!localStorage.isAdmin || !admin) {
    return null
  }

  const isSuperAdmin = location.pathname.indexOf('/super-admin') === 0
  const isAdmin = location.pathname.indexOf('/admin') === 0 || isSuperAdmin

  const shops = get(admin, 'shops', [])
  const activeShop = shops.find((s) => s.authToken === config.activeShop)

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
        {!activeShop ? null : (
          <div className="btn-group btn-group-sm mx-auto admin-switcher">
            <button
              type="button"
              className={`btn btn-${isAdmin ? '' : 'outline-'}primary px-4`}
              onClick={() => {
                if (isAdmin) return
                dispatch({ type: 'setStorefrontLocation', location })
                history.push(adminLocation || '/admin')
              }}
            >
              Admin
            </button>
            <button
              type="button"
              className={`btn btn-${isAdmin ? 'outline-' : ''}primary px-4${
                activeShop.viewable ? '' : ' disabled'
              }`}
              onClick={() => {
                if (!isAdmin) return
                dispatch({ type: 'setAdminLocation', location })
                history.push(storefrontLocation || '/')
              }}
            >
              Storefront
            </button>
          </div>
        )}
        <User />
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
      display: grid
      grid-template-columns: 1fr 1fr
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
