import React, { useEffect, useState } from 'react'
import { Redirect, Switch, Route } from 'react-router-dom'
import 'components/admin/Styles'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()
  const [newShop, setNewShop] = useState()
  const { get } = useBackendApi({ authToken: true })
  const [{ admin, reload }, dispatch] = useStateValue()

  useEffect(() => {
    get('/auth')
      .then((auth) => {
        dispatch({ type: 'setAuth', auth })
        setLoading(false)
      })
      .catch(() => {
        setError(true)
      })
  }, [reload.auth])

  if (error) {
    return <div className="fixed-loader">Admin Connection Error</div>
  } else if (loading) {
    return <div className="fixed-loader">Loading...</div>
  }

  if (!admin) {
    return <Login />
  }

  return (
    <div className="admin">
      <nav>
        <div className="fullwidth-container">
          <h1>
            <img className="dshop-logo" src="images/dshop-logo-blue.svg" />
            <AccountSelector onNewShop={() => setNewShop(true)} />
            <NewShop shouldShow={newShop} onClose={() => setNewShop(false)} />
          </h1>
          <div className="user">
            <Icons.User />
            {admin.email}
          </div>
        </div>
      </nav>
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
