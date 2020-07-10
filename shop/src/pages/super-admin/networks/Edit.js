import React, { useEffect } from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useSetState from 'utils/useSetState'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import NetworkForm from './_Form'
import MakeActiveButton from './_MakeActiveButton'

const EditNetwork = () => {
  const { config } = useConfig()
  const [{ admin }, dispatch] = useStateValue()
  const [state, setState] = useSetState()
  const match = useRouteMatch('/super-admin/networks/:networkId')
  const { networkId } = match.params

  useEffect(() => {
    const timeout = setTimeout(() => setState({ feedback: null }), 2000)
    return function cleanup() {
      clearTimeout(timeout)
    }
  }, [state.feedback])

  const network = get(admin, 'networks', []).find(
    (n) => String(n.networkId) === networkId
  )

  function onSave(network) {
    setState({ feedback: 'Saving...' })
    fetch(`${config.backend}/networks/${networkId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(network)
    })
      .then(async (res) => {
        if (res.ok) {
          setState({ feedback: 'Saved OK' })
          dispatch({ type: 'reload', target: 'auth' })
        }
      })
      .catch((err) => {
        setState({ feedback: 'Error saving' })
        console.error('Error signing in', err)
      })
  }

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/super-admin/networks" className="muted">
          Networks
        </Link>
        <span className="chevron" />
        Edit
        {network.active ? null : (
          <div className="actions">
            <MakeActiveButton network={network} />
          </div>
        )}
      </h3>
      <div className="row">
        <div className="col-md-8">
          <NetworkForm
            onSave={onSave}
            network={network}
            feedback={state.feedback}
          />
        </div>
      </div>
    </>
  )
}

export default EditNetwork
