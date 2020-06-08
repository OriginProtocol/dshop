import React from 'react'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import NetworkForm from '../networks/_Form'

const ServerSetup = () => {
  const { config } = useConfig()
  const [, dispatch] = useStateValue()

  function onSave(network) {
    fetch(`${config.backend}/networks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...network, active: true })
    })
      .then(async (res) => {
        if (res.ok) {
          dispatch({ type: 'reload', target: 'auth' })
        }
      })
      .catch((err) => {
        console.error('Error signing in', err)
      })
  }

  return (
    <>
      <div className="mb-4">Server setup:</div>
      <NetworkForm onSave={onSave} />
    </>
  )
}

export default ServerSetup
