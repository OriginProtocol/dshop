import React, { useEffect, useState } from 'react'
import { Redirect, Switch, Route } from 'react-router-dom'
import get from 'lodash/get'

import 'components/admin/Styles'
import Toaster from 'components/Toaster'

import { useStateValue } from 'data/state'
import useAuth from 'utils/useAuth'

import Menu from './_Menu'
import FirstTime from './setup/FirstTime'

import Shops from './shops/List'
import Shop from './shops/Show'
import NewShop from './shops/NewShop'
import Dashboard from './Dashboard'
import Networks from './networks/List'
import NewNetwork from './networks/New'
import EditNetwork from './networks/Edit'

import Users from './users/List'
import User from './users/Show'
import NewUser from './users/New'
import EditUser from './users/Edit'

import Nav from '../admin/_Nav'

const SuperAdmin = () => {
  const { loading, error } = useAuth()
  const [newShop, setNewShop] = useState()

  const [{ admin, reload }, dispatch] = useStateValue()

  useEffect(() => {
    document.title = 'Origin Dshop Admin'
  }, [reload.auth])

  if (error) {
    return <div className="fixed-loader">API Connection Error</div>
  } else if (loading && !admin) {
    return <div className="fixed-loader">Loading...</div>
  }

  if (!get(admin, 'success')) {
    return (
      <FirstTime next={() => dispatch({ type: 'reload', target: 'auth' })} />
    )
  }

  if (!get(admin, 'superuser')) {
    return <Redirect to="/admin" />
  }

  return (
    <div className="admin">
      <Toaster />
      <Nav superAdmin={true} newShop={newShop} setNewShop={setNewShop} />
      <div className="sidebar-layout">
        <div className="sidebar-container">
          <Menu />
        </div>
        <div className="main-content-container">
          <Switch>
            <Route path="/super-admin/shops/new" component={NewShop} />
            <Route path="/super-admin/shops/:shopId" component={Shop} />
            <Route path="/super-admin/shops" component={Shops} />

            <Route path="/super-admin/networks/new" component={NewNetwork} />
            <Route path="/super-admin/networks/:id" component={EditNetwork} />
            <Route path="/super-admin/networks" component={Networks} />

            <Route path="/super-admin/users/new" component={NewUser} />
            <Route
              path="/super-admin/users/:userId/edit"
              component={EditUser}
            />
            <Route path="/super-admin/users/:userId" component={User} />
            <Route path="/super-admin/users" component={Users} />

            <Route path="/super-admin/dashboard" component={Dashboard} />
            <Redirect to="/super-admin/dashboard" />
          </Switch>
        </div>
      </div>
    </div>
  )
}

export default SuperAdmin

require('react-styl')(`
  .admin table a
    color: #007bff
`)
