import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

import AccountSelector from './_AccountSelector'
import NewShop from './_NewShop'
import * as Icons from 'components/icons/Admin'

const Nav = ({ newShop, setNewShop, superAdmin }) => {
  const [{ admin, storefrontLocation }, dispatch] = useStateValue()
  const location = useLocation()
  const history = useHistory()
  const { config, setActiveShop } = useConfig()

  const shops = get(admin, 'shops', [])
  const activeShop = shops.find((s) => s.authToken === config.activeShop)

  return (
    <nav>
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
            superAdmin={superAdmin}
            onNewShop={() => setNewShop(true)}
          />
        </h1>
        {!activeShop ? null : (
          <div className="nav-preview">
            <a
              className={activeShop.viewable ? '' : 'disabled'}
              href="#storefront"
              onClick={(e) => {
                e.preventDefault()
                dispatch({ type: 'setAdminLocation', location })
                history.push(storefrontLocation || '/')
              }}
            >
              Storefront
            </a>
          </div>
        )}
        <div className="user">
          <Icons.User />
          {admin.email}
        </div>
      </div>
      <NewShop shouldShow={newShop} onClose={() => setNewShop(false)} />
    </nav>
  )
}

export default Nav
