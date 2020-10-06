import React from 'react'
import { Switch, Route } from 'react-router-dom'

import ServerSettings from './Server'
import UsersList from './users/List'
import Console from './Console'
import General from './general/Edit'
import Payments from './payments/List'
import Apps from './apps/List'
import Deployments from './deployments/List'
import Shipping from './shipping/Edit'
import Advanced from './Advanced'
import Checkout from './checkout/Edit'
import Appearance from './appearance/Edit'
import List from './List'

const AdminSettings = () => (
  <Switch>
    <Route path="/admin/settings/users">
      <UsersList />
    </Route>
    <Route path="/admin/settings/server">
      <ServerSettings />
    </Route>
    <Route path="/admin/settings/console">
      <Console />
    </Route>
    <Route path="/admin/settings/payments">
      <Payments />
    </Route>
    <Route path="/admin/settings/apps">
      <Apps />
    </Route>
    <Route path="/admin/settings/deployments">
      <Deployments />
    </Route>
    <Route path="/admin/settings/shipping">
      <Shipping />
    </Route>
    <Route path="/admin/settings/advanced">
      <Advanced />
    </Route>
    <Route path="/admin/settings/checkout">
      <Checkout />
    </Route>
    <Route path="/admin/settings/appearance">
      <Appearance />
    </Route>
    <Route path="/admin/settings/general">
      <General />
    </Route>
    <Route>
      <List />
    </Route>
  </Switch>
)

export default AdminSettings
