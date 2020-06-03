import React, { useEffect, useState } from 'react'
import { Redirect, Switch, Route } from 'react-router-dom'
import get from 'lodash/get'
// import Styl from 'react-styl'
import 'components/admin/Styles'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

import Login from './Login'
import Menu from './_Menu'
import FirstTime from './setup/FirstTime'

import Shops from './shops/Shops'
import Shop from './shops/shop/Shop'
import NewShop from './shops/new-shop/NewShop'
import Dashboard from './Dashboard'
import Networks from './networks/Networks'
import NewNetwork from './networks/CreateNetwork'
import Users from './users/Users'
import User from './users/User'
import NewUser from './users/NewUser'

const SuperAdmin = () => {
  const { config } = useConfig()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()

  const [{ admin, reload }, dispatch] = useStateValue()

  useEffect(() => {
    // if (!window.backendAdminCss) {
    //   // Need to re-add stylesheet as this component is lazy loaded
    //   Styl.addStylesheet()
    //   window.backendAdminCss = true
    // }
    document.title = 'Origin Dshop Admin'

    fetch(`${config.backend}/superuser/auth`, { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 200) {
          const auth = await response.json()
          dispatch({ type: 'setAuth', auth })
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => {
        setError(true)
      })
  }, [reload.auth])

  if (error) {
    return <div className="fixed-loader">API Connection Error</div>
  } else if (loading && !admin) {
    return <div className="fixed-loader">Loading...</div>
  }

  if (!get(admin, 'success')) {
    if (!admin || admin.reason === 'not-logged-in') {
      return <Login next={() => dispatch({ type: 'reload', target: 'auth' })} />
    }
    return (
      <FirstTime next={() => dispatch({ type: 'reload', target: 'auth' })} />
    )
  }

  return (
    <div className="admin">
      <nav>
        <div className="container">
          <h1>
            <img src="images/dshop-logo.svg" />
            <div>Super Admin</div>
          </h1>
          <div>{`Welcome, ${admin.email}`}</div>
        </div>
      </nav>
      <div className="container">
        <div className="row">
          <div className="col-md-3">
            <Menu />
          </div>
          <div className="col-md-9">
            <Switch>
              <Route path="/super-admin/shops/new" component={NewShop} />
              <Route path="/super-admin/shops/:shopId" component={Shop} />
              <Route path="/super-admin/shops" component={Shops} />
              <Route path="/super-admin/networks/new" component={NewNetwork} />
              <Route path="/super-admin/networks" component={Networks} />
              <Route path="/super-admin/users/new" component={NewUser} />
              <Route path="/super-admin/users/:userId" component={User} />
              <Route path="/super-admin/users" component={Users} />
              <Route path="/super-admin/dashboard" component={Dashboard} />
              <Redirect to="/super-admin/dashboard" />
            </Switch>
          </div>
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
