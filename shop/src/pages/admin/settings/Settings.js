import React from 'react'
import { Switch, Route } from 'react-router-dom'

import ServerSettings from './Server'
import UsersList from './users/List'
import Console from './Console'
import Appearance from './appearance/Edit'
import Payments from './payments/List'
import Apps from './apps/List'
import Deployments from './deployments/List'
import Shipping from './shipping/List'

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
    <Route>
      <Appearance />
    </Route>
  </Switch>
)

export default AdminSettings
