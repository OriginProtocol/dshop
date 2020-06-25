import React, { useState } from 'react'
import {
  Redirect,
  Switch,
  Route,
  useLocation,
  useHistory
} from 'react-router-dom'
import 'components/admin/Styles'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useAuth from 'utils/useAuth'
import useConfig from 'utils/useConfig'

import * as Icons from 'components/icons/Admin'
import Login from 'components/admin/Login'
import Products from './products/List'
import EditProduct from './products/Edit'
import Collections from './collections/List'
import Collection from './collections/Show'
import Dashboard from './Dashboard'
import Orders from './Orders'
import Discounts from './discounts/Discounts'
import EditDiscount from './discounts/EditDiscount'
import Order from './order/Order'
import Settings from './settings/Settings'
import Events from './Events'
import Menu from './_Menu'
import AccountSelector from './_AccountSelector'
import Onboarding from './Onboarding'
import NewShop from './_NewShop'
import PublishChanges from './_PublishChanges'

const Admin = () => {
  const { loading, error } = useAuth()
  const [newShop, setNewShop] = useState()
  const { config, setActiveShop } = useConfig()
  const [{ admin }, dispatch] = useStateValue()
  const shops = get(admin, 'shops', [])

  if (error) {
    return <div className="fixed-loader">Admin Connection Error</div>
  } else if (loading) {
    return <div className="fixed-loader">Loading...</div>
  }

  if (!admin) {
    return <Login />
  }

  if (!shops.length) {
    return <div className="admin">Setup new shop</div>
  }

  if (!config.activeShop) {
    const shops = get(admin, 'shops', [])
    return (
      <div className="admin">
        <Nav />
        <NewShop shouldShow={newShop} onClose={() => setNewShop(false)} />
        <div className="shop-chooser">
          <h3>Select a store</h3>
          <div className="shops">
            {shops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => {
                  setActiveShop(shop.authToken)
                  setTimeout(() => {
                    dispatch({ type: 'reset', dataDir: shop.authToken })
                  }, 50)
                }}
              >
                {shop.name}
              </div>
            ))}
          </div>
          <div className="create-shop">
            <button
              className="btn btn-outline-primary btn-sm px-5"
              onClick={() => setNewShop(true)}
            >
              Add Store
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin">
      <Nav setNewShop={setNewShop} />
      <NewShop shouldShow={newShop} onClose={() => setNewShop(false)} />
      <div className="sidebar-layout">
        <div className="sidebar-container">
          <Menu />
        </div>
        <div className="main-content-container">
          <PublishChanges />
          <Switch>
            <Route path="/admin/discounts/:id" component={EditDiscount} />
            <Route path="/admin/discounts" component={Discounts} />
            <Route path="/admin/products/:id" component={EditProduct} />
            <Route path="/admin/products" component={Products} />
            <Route path="/admin/collections/:id" component={Collection} />
            <Route path="/admin/collections" component={Collections} />
            <Route path="/admin/settings" component={Settings} />
            <Route path="/admin/events" component={Events} />
            <Route path="/admin/orders/:id" component={Order} />
            <Route path="/admin/orders" component={Orders} />
            <Route path="/admin/dashboard" component={Dashboard} />
            <Route path="/admin/onboarding" component={Onboarding} />
            <Redirect to="/admin/dashboard" />
          </Switch>
        </div>
      </div>
    </div>
  )
}

const Nav = ({ setNewShop }) => {
  const [{ admin, storefrontLocation }, dispatch] = useStateValue()
  const location = useLocation()
  const history = useHistory()
  const { config, setActiveShop } = useConfig()

  return (
    <nav>
      <div className="fullwidth-container">
        <h1>
          <img
            className="dshop-logo"
            src="images/dshop-logo-blue.svg"
            onClick={() => {
              setActiveShop(null)
              setTimeout(() => {
                dispatch({ type: 'reset', dataDir: '' })
              }, 50)
            }}
          />
          <AccountSelector onNewShop={() => setNewShop(true)} />
        </h1>
        {!config.activeShop ? null : (
          <div className="nav-preview">
            <a
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
    </nav>
  )
}

export default Admin

require('react-styl')(`
  .nav-preview
    margin-right: 2rem
    font-size: 14px
    vertical-align: 3px
  .admin .shop-chooser
    padding-top: 3rem
    background-color: #fafbfc
    display: flex
    flex-direction: column
    align-items: center
    flex: 1
    .create-shop
      margin-top: 2rem
    .shops
      margin-top: 1.5rem
      display: grid
      grid-template-columns: 50% 50%
      grid-column-gap: 1rem
      grid-row-gap: 1rem
      > div
        color: #3b80ee
        text-align: center
        font-size: 20px
        background: #fff
        border-radius: 10px
        box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.1)
        padding: 1.5rem 2rem
        cursor: pointer
        font-weight: bold
`)
