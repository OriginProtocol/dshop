import React from 'react'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'

import NetworkForm from '../networks/_Form'

const ServerSetup = () => {
  const { post } = useBackendApi()
  const [, dispatch] = useStateValue()

  function onSave(network) {
    const body = JSON.stringify({ ...network, active: true })
    post('/networks', { method: 'POST', body })
      .then(() => {
        dispatch({ type: 'reload', target: 'auth' })
      })
      .catch((err) => {
        console.error('Error signing in', err)
      })
  }

  return (
    <div className="server-setup-form">
      <div className="desc">Configure your server</div>
      <NetworkForm onSave={onSave} />
    </div>
  )
}

export default ServerSetup

require('react-styl')(`
  .server-setup-form button
    box-shadow: 5px 5px 8px 0 #0065d2, -3px -3px 6px 0 #2a92ff, inset 3px 3px 2px 0 #0e4d90, inset -3px -3px 2px 0 #021d3a
    background-image: linear-gradient(289deg, #02203f, #053c77 6%)
    color: #fff

  .server-setup-form button[type=submit]
    box-shadow: 5px 5px 8px 0 #0065d2, -3px -3px 6px 0 #2a92ff, inset 3px 3px 2px 0 #0e4d90, inset -3px -3px 2px 0 #021d3a
    background-image: linear-gradient(289deg, #02203f, #053c77 6%)
    color: #fff
    border-radius: 5px
    width: auto
    margin: 0.75rem auto
    display: inline-block
    padding: 0.5rem 1.75rem
    font-size: 1.125rem

  .server-setup-form
    width: 100%

    .desc
      font-size: 1.125rem
      text-align: center
      color: #ffffff
      margin-bottom: 1.5rem

    form
      width: 100%
      border-radius: 5px
      margin: 1rem auto
      box-shadow: 1px 1px 0 0 #006ee3, -1px -1px 0 0 #0e83ff
      background-image: linear-gradient(313deg, #007cff 100%, #0076f4 7%)
      padding: 2rem 2.5rem

      .advanced-settings-link a
        color: #fff
`)
