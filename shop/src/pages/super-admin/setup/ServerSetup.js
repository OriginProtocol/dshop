import React from 'react'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import NetworkForm from '../networks/_Form'
import { buttonBgStyle, buttonStyle, formGroupStyles } from './_formStyles'

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
    <div className="server-setup-form">
      <div className="desc">Configure your server</div>
      <NetworkForm onSave={onSave} />
    </div>
  )
}

export default ServerSetup

require('react-styl')(`
  ${formGroupStyles('.server-setup-form form .form-group')}

  ${buttonBgStyle('.server-setup-form button')}

  ${buttonStyle('.server-setup-form button[type=submit]')}

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
