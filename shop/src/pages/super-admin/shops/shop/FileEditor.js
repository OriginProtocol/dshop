import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'

const Files = [
  { name: 'Config', path: 'config.json' },
  { name: 'Products', path: 'products.json' },
  { name: 'Collections', path: 'collections.json' },
  { name: 'Shipping', path: 'shipping.json' },
  { name: 'About', path: 'about.html' }
]

let bc

const AdminShop = ({ shop }) => {
  const [state, setState] = useSetState({
    config: '',
    [Files[0].path]: '',
    valid: true,
    save: 0,
    activeFile: Files[0].path
  })

  useEffect(() => {
    fetch(`/${shop}/${state.activeFile}`)
      .then((res) => (res.ok ? res.text() : new Promise(() => '')))
      .then((content) => {
        setState({ [state.activeFile]: content, valid: true })
      })
  }, [state.activeFile])

  useEffect(() => {
    if (!state.save) {
      return
    }
    const body = new FormData()
    const file = new Blob([state[state.activeFile]])
    body.append('file', file, state.activeFile)

    fetch(`/shops/${shop.authToken}/save-files`, { method: 'POST', body })
  }, [state.save])

  function onSave(e) {
    e.preventDefault()
    setState({ save: state.save + 1 })
    bc.postMessage('reload')
  }

  useEffect(() => {
    bc = new BroadcastChannel('dshop')
    return function cleanup() {
      bc.close()
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.which == 83) {
        onSave(e)
        return false
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return function cleanup() {
      window.removeEventListener('keydown', onKeyDown)
    }
  })

  return (
    <form className="admin-shop-edit" onSubmit={onSave}>
      <div className="d-flex mb-3">
        <select
          onChange={(e) => setState({ activeFile: e.target.value })}
          className="form-control w-auto"
        >
          {Files.map((file) => (
            <option key={file.path} value={file.path}>
              {file.name}
            </option>
          ))}
        </select>

        <div className="ml-auto d-flex align-items-center">
          {state.valid ? null : <div className="mr-3">Invalid JSON</div>}
          <button
            className={`btn btn-primary${state.valid ? '' : ' disabled'}`}
            children="Save"
          />
        </div>
      </div>
      <div className="form-group">
        <textarea
          className="form-control"
          value={state[state.activeFile]}
          onChange={(e) => {
            let valid = true
            if (state.activeFile.indexOf('.json') > 0) {
              try {
                JSON.parse(e.target.value)
              } catch (e) {
                valid = false
              }
            }
            setState({ [state.activeFile]: e.target.value, valid })
          }}
        />
      </div>
    </form>
  )
}

export default AdminShop

require('react-styl')(`
  .admin-shop-edit
    textarea
      font-family: monospace
      height: 90vh
`)
