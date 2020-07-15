import React from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'

import useSetState from 'utils/useSetState'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import NetworkForm from './_Form'
import MakeActiveButton from './_MakeActiveButton'

const EditNetwork = () => {
  const [{ admin }, dispatch] = useStateValue()
  const [state, setState] = useSetState()
  const { post } = useBackendApi()
  const match = useRouteMatch('/super-admin/networks/:networkId')
  const { networkId } = match.params

  const network = get(admin, 'networks', []).find(
    (n) => String(n.networkId) === networkId
  )

  function onSave(network) {
    setState({ feedback: 'Saving...' })
    const body = JSON.stringify(network)
    post(`/networks/${networkId}`, { method: 'PUT', body })
      .then(() => {
        setState({ feedback: null })
        dispatch({ type: 'toast', message: 'Saved OK' })
        dispatch({ type: 'reload', target: 'auth' })
      })
      .catch((err) => {
        dispatch({ type: 'toast', style: 'error', message: 'Error saving' })
        console.error('Error saving network', err)
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
