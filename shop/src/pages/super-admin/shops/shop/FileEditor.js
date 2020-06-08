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
    activeFile: Files[0].path,
    saving: false
  })

  useEffect(() => {
    fetch(`/${shop.authToken}/${state.activeFile}`)
      .then((res) => (res.ok ? res.text() : new Promise(() => '')))
      .then((content) => {
        setState({ [state.activeFile]: content, valid: true })
      })
  }, [state.activeFile])

  useEffect(() => {
    if (!state.save) {
      return
    }
    setState({ saving: true })
    const body = new FormData()
    const file = new Blob([state[state.activeFile]])
    body.append('file', file, state.activeFile)

    let timeout
    fetch(`/shops/${shop.authToken}/save-files`, {
      method: 'POST',
      body
    }).then(() => {
      setState({ saving: false, saved: true })
      timeout = setTimeout(() => setState({ saved: false }), 2000)
    })
    return function cleanup() {
      clearTimeout(timeout)
    }
  }, [state.save])

  function onSave(e) {
    e.preventDefault()
    setState({ save: state.save + 1 })
    bc.postMessage('reload')
  }

  useEffect(() => {
    if (!window.BroadcastChannel) {
      return
    }
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
          {state.saved ? <div className="mr-3">Saved ✅</div> : null}
          {state.saving ? <div className="mr-3">Saving...</div> : null}
          <button
            className={`btn btn-primary${state.valid ? '' : ' disabled'}`}
            children="Save"
          />
          <button
            type="button"
            className={`btn btn-outline-primary ml-2${
              state.valid ? '' : ' disabled'
            }`}
            children="Prettify"
            onClick={() => {
              if (!state.valid) return
              setState({
                [state.activeFile]: JSON.stringify(
                  JSON.parse(state[state.activeFile]),
                  null,
                  2
                )
              })
            }}
          />
        </div>
      </div>
      <div className="form-group">
        <textarea
          autoComplete="off"
          spellCheck="false"
          className="form-control"
          value={state[state.activeFile]}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
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
      height: 90vh
`)
