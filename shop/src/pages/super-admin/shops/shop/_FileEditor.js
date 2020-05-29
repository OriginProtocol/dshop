import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'

let bc

const AdminShop = ({ Files, shopId, activeFile }) => {
  const [state, setState] = useSetState({
    config: '',
    [Files[0].path]: '',
    valid: true,
    save: 0
  })

  useEffect(() => {
    fetch(`/${shopId}/${activeFile}`)
      .then((res) => (res.ok ? res.text() : new Promise(() => '')))
      .then((content) => {
        setState({ [activeFile]: content, valid: true })
      })
  }, [activeFile])

  useEffect(() => {
    if (!state.save) {
      return
    }
    const body = new FormData()
    const file = new Blob([state[activeFile]])
    body.append('file', file, activeFile)

    fetch(`/shops/${shopId}/save-files`, { method: 'POST', body })
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
      <div className="form-group">
        <textarea
          className="form-control"
          value={state[activeFile]}
          onChange={(e) => {
            let valid = true
            if (activeFile.indexOf('.json') > 0) {
              try {
                JSON.parse(e.target.value)
              } catch (e) {
                valid = false
              }
            }
            setState({ [activeFile]: e.target.value, valid })
          }}
        ></textarea>
      </div>
      <div className="d-flex">
        <button className={`btn btn-primary${state.valid ? '' : ' disabled'}`}>
          Save
        </button>
        {state.valid ? null : <div className="ml-3">Invalid JSON</div>}
      </div>
    </form>
  )
}

export default AdminShop

require('react-styl')(`
  .admin-shop-edit
    textarea
      font-family: monospace
      min-height: 90vh
`)
