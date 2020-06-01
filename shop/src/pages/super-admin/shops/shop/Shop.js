import React from 'react'
import { Link, Switch, Route, useRouteMatch, Redirect } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'

import SyncShop from './Sync'
import DeleteShop from './_Delete'
import DeployShop from './Deploy'
import FileEditor from './FileEditor'
import Assets from './Assets'
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
  const [{ admin }] = useStateValue()
  const match = useRouteMatch('/super-admin/shops/:shopId/:tab?')
  const { shopId, tab } = match.params

  const shops = get(admin, 'shops', [])
  const shop = shops.find((s) => s.authToken === shopId)
  if (!shops.length) {
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
        <div className="ml-auto">
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              sessionStorage.dataDir = shop.authToken
              window.open(location.origin)
            }}
            children="Storefront"
          />
          <button
            className="btn btn-outline-primary ml-2"
            onClick={() => {
              sessionStorage.dataDir = shop.authToken
              window.open(`${location.origin}/#/admin/settings/server`)
            }}
            children="Admin"
          />
          <DeleteShop shop={shop} className="ml-2" />
        </div>
      </h3>

      <ul className="nav nav-tabs mt-3 mb-3">
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
          <FileEditor shop={shopId} />
        </Route>
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
