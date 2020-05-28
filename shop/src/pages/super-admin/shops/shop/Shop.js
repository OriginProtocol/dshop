import React, { useEffect } from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useSetState from 'utils/useSetState'

import Link from 'components/Link'

import DeleteShop from './_Delete'
import DeployShop from './_Deploy'

const Files = [
  { name: 'Config', path: 'config.json' },
  { name: 'Products', path: 'products.json' },
  { name: 'Collections', path: 'collections.json' },
  { name: 'Shipping', path: 'shipping.json' }
]

const AdminShop = () => {
  const [{ admin }] = useStateValue()
  const match = useRouteMatch('/super-admin/shops/:shopId')
  const { shopId } = match.params
  const [state, setState] = useSetState({
    config: '',
    activeFile: Files[0].path,
    [Files[0].path]: '',
    valid: true,
    save: 0
  })

  useEffect(() => {
    fetch(`/${shopId}/${state.activeFile}`)
      .then((res) => res.text())
      .then((content) => {
        setState({ [state.activeFile]: content, valid: true })
      })
  }, [state.activeFile])

  useEffect(() => {
    if (!state.save) {
      return
    }
    const body = new FormData()
    const file = new Blob([state[state.activeFile]], {
      type: 'application/json'
    })
    body.append('file', file, state.activeFile)

    fetch(`/shops/${shopId}/save-files`, {
      method: 'POST',
      body
    })
      .then((res) => res.json())
      .then((json) => {
        console.log(json)
      })
  }, [state.save])

  const shops = get(admin, 'shops', [])
  const shop = shops.find((s) => s.authToken === shopId)
  if (!shop) {
    return <div>Loading...</div>
  }

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/super-admin/shops" className="muted">
          Shops
        </Link>
        <span className="chevron" />
        {shop.name}
        <div className="ml-auto">
          <DeployShop shopId={shopId} />
          <DeleteShop shopId={shopId} className="ml-2" />
        </div>
      </h3>

      <ul className="nav nav-tabs mt-3 mb-3">
        {Files.map((file) => (
          <li className="nav-item" key={file.path}>
            <a
              className={`nav-link${
                state.activeFile === file.path ? ' active' : ''
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setState({ activeFile: file.path })
              }}
              children={file.name}
            />
          </li>
        ))}
      </ul>
      <form
        className="admin-shop-edit"
        onSubmit={(e) => {
          e.preventDefault()
          setState({ save: state.save + 1 })
        }}
      >
        <div className="form-group">
          <textarea
            className="form-control"
            value={state[state.activeFile]}
            onChange={(e) => {
              let valid = true
              try {
                JSON.parse(e.target.value)
              } catch (e) {
                valid = false
              }
              setState({ [state.activeFile]: e.target.value, valid })
            }}
          ></textarea>
        </div>
        <div className="d-flex">
          <button
            className={`btn btn-primary${state.valid ? '' : ' disabled'}`}
          >
            Save
          </button>
          {state.valid ? null : <div className="ml-3">Invalid JSON</div>}
        </div>
      </form>
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
