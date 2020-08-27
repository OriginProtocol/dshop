import React from 'react'
import { Link, Switch, Route, useRouteMatch, Redirect } from 'react-router-dom'

import useShop from 'utils/useShop'

import SyncShop from './shop/Sync'
import DeleteShop from './shop/_Delete'
import DeployShop from './shop/Deploy'
import FileEditor from './shop/FileEditor'
import Assets from './shop/Assets'
import Settings from './shop/Settings'
// import ServerSettings from 'pages/admin/settings/Server'

const NavItem = ({ url, active, name }) => (
  <li className="nav-item">
    <Link
      className={`nav-link${active ? ' active' : ''}`}
      to={url}
      children={name}
    />
  </li>
)

const AdminShop = () => {
  const match = useRouteMatch('/super-admin/shops/:shopId/:tab?')
  const { shopId, tab } = match.params

  const { shop, loading } = useShop(shopId)

  if (loading) {
    return <div>Loading...</div>
  }
  if (!shop) {
    return <div>Shop not found</div>
  }

  const prefix = `/super-admin/shops/${shopId}`

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/super-admin/shops" className="muted">
          Shops
        </Link>
        <span className="chevron" />
        {shop.name}
        <div className="actions">
          <DeleteShop shop={shop} />
        </div>
      </h3>

      <ul className="nav nav-tabs mt-3 mb-3">
        {/* <NavItem
          active={tab === 'settings'}
          url={`${prefix}/settings`}
          name="Settings"
        /> */}
        <NavItem
          active={tab === 'files'}
          url={`${prefix}/files`}
          name="Files"
        />
        <NavItem
          active={tab === 'assets'}
          url={`${prefix}/assets`}
          name="Assets"
        />
        <NavItem
          active={tab === 'deploy'}
          url={`${prefix}/deploy`}
          name="Deploy"
        />
        <NavItem active={tab === 'sync'} url={`${prefix}/sync`} name="Sync" />
      </ul>
      <Switch>
        <Route path={`${prefix}/assets`}>
          <Assets shop={shop} />
        </Route>
        <Route path={`${prefix}/deploy`}>
          <DeployShop shop={shop} />
        </Route>
        <Route path={`${prefix}/sync`}>
          <SyncShop shop={shop} />
        </Route>
        <Route path={`${prefix}/files`}>
          <FileEditor shop={shop} />
        </Route>
        <Route path={`${prefix}/settings`}>
          <Settings shop={shop} />
        </Route>
        {/* <Redirect to={`${prefix}/settings`} /> */}
        <Redirect to={`${prefix}/files`} />
      </Switch>
    </>
  )
}

export default AdminShop

require('react-styl')(`
  .admin-shop-edit
    textarea
      font-family: monospace
      min-height: 90vh
`)
