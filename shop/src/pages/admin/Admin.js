import React, { useState } from 'react'
import { Redirect, Switch, Route } from 'react-router-dom'
import 'components/admin/Styles'
import get from 'lodash/get'
import fbt from 'fbt'
import { useStateValue } from 'data/state'
import useAuth from 'utils/useAuth'
import useConfig from 'utils/useConfig'
import { isLoggedIn } from 'utils/auth'
import usePGP from 'utils/usePGP'

import Toaster from 'components/Toaster'

import Auth from './auth/Auth'
import Products from './products/List'
import EditProduct from './products/Edit'
import Collections from './collections/List'
import Collection from './collections/Show'
import Dashboard from './dashboard/Dashboard'
import Orders from './Orders'
import Discounts from './discounts/List'
import EditDiscount from './discounts/Edit'
import Order from './order/Order'
import Settings from './settings/Settings'
import Events from './order/Events'
import Menu from './_Menu'
import Onboarding from './onboarding/Onboarding'
import PublishChanges from './_PublishChanges'
import Nav from './_Nav'
import StoreSelector from './StoreSelector'

const Admin = () => {
  usePGP()
  const { loading, error } = useAuth()
  const [newShop, setNewShop] = useState()
  const { config, setActiveShop } = useConfig()
  const [{ admin }] = useStateValue()

  if (error) {
    return <div className="fixed-loader">Admin Connection Error</div>
  } else if (loading && !get(admin, 'shopsCount')) {
    return (
      <div className="fixed-loader">
        <fbt desc="Loading">Loading</fbt>...
      </div>
    )
  }

  if (!admin || !isLoggedIn(admin)) {
    return <Auth />
  }

  // Force admin users to backend URL
  if (admin.backendUrl && admin.backendUrl !== window.location.origin) {
    window.location = `${admin.backendUrl}/${window.location.hash}`
    return <div className="fixed-loader">Redirecting...</div>
  }

  if (!config.activeShop || !get(admin, 'shopsCount')) {
    return <StoreSelector {...{ setActiveShop, admin, newShop, setNewShop }} />
  }

  return (
    <div className="admin">
      <Toaster />
      <Nav newShop={newShop} setNewShop={setNewShop} />
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

export default Admin
