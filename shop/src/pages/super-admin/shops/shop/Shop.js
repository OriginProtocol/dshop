import React from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useSetState from 'utils/useSetState'

import Link from 'components/Link'

import DeleteShop from './_Delete'
import DeployShop from './_Deploy'
import FileEditor from './_FileEditor'
import Assets from './_Assets'
import ServerSettings from 'pages/admin/settings/Server'

const Files = [
  { name: 'Config', path: 'config.json' },
  { name: 'Products', path: 'products.json' },
  { name: 'Collections', path: 'collections.json' },
  { name: 'Shipping', path: 'shipping.json' },
  { name: 'About', path: 'about.html' }
]

const NavItem = ({ id, active, name, setState }) => (
  <li className="nav-item">
    <a
      className={`nav-link${active ? ' active' : ''}`}
      href="#"
      onClick={(e) => {
        e.preventDefault()
        setState({ activeFile: id })
      }}
      children={name}
    />
  </li>
)

const AdminShop = () => {
  const [{ admin }] = useStateValue()
  const match = useRouteMatch('/super-admin/shops/:shopId')
  const { shopId } = match.params

  const [state, setState] = useSetState({
    activeFile: Files[0].path
  })

  const shops = get(admin, 'shops', [])
  const shop = shops.find((s) => s.authToken === shopId)
  if (!shop) {
    return <div>Loading...</div>
  }

  const { activeFile } = state

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
            children="Preview"
          />
          <DeployShop shop={shop} className="ml-2" />
          <DeleteShop shop={shop} className="ml-2" />
        </div>
      </h3>

      <ul className="nav nav-tabs mt-3 mb-3">
        {Files.map((file) => (
          <NavItem
            key={file.path}
            active={activeFile === file.path}
            id={file.path}
            name={file.name}
            setState={setState}
          />
        ))}
        <NavItem
          active={activeFile === 'assets'}
          id="assets"
          name="Assets"
          setState={setState}
        />
        {/* <NavItem
          active={activeFile === 'server'}
          id="server"
          name="Server"
          setState={setState}
        /> */}
      </ul>
      {activeFile === 'assets' ? (
        <Assets shop={shop} />
      ) : activeFile === 'server' ? (
        <ServerSettings shop={shop} />
      ) : (
        <FileEditor {...{ Files, shopId, activeFile }} />
      )}
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
