import React from 'react'

import useConfig from 'utils/useConfig'
import useRedirect from 'utils/useRedirect'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import NetworkForm from './_Form'

const NewNetwork = () => {
  const redirectTo = useRedirect()
  const { config } = useConfig()
  const [, dispatch] = useStateValue()

  function onSave(network) {
    fetch(`${config.backend}/networks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(network)
    })
      .then((res) => {
        if (res.ok) {
          redirectTo('/super-admin/networks')
          dispatch({ type: 'reload', target: 'auth' })
        }
      })
      .catch((err) => {
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
        New
      </h3>
      <div className="row">
        <div className="col-md-8">
          <NetworkForm onSave={onSave} />
        </div>
      </div>
    </>
  )
}

export default NewNetwork
