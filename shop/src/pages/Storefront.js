import React, { useEffect, useState } from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import AdminNav from 'pages/admin/_Nav'
import Checkout from './checkout/Loader'
import Main from './Main'
import Order from './OrderLoader'
import Password from './Password'

const Storefront = () => {
  const location = useLocation()
  const [{ passwordAuthed }, dispatch] = useStateValue()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const { config } = useConfig()

  const isOrder = location.pathname.indexOf('/order') === 0

  useEffect(() => {
    if (!get(config, 'passwordProtected') || passwordAuthed) {
      return
    }
    setPasswordLoading(true)
    fetch(`${config.backend}/password`, {
      headers: {
        'content-type': 'application/json',
        authorization: `bearer ${encodeURIComponent(config.backendAuthToken)}`
      },
      credentials: 'include'
    }).then(async (response) => {
      setPasswordLoading(false)
      if (response.status === 200) {
        const data = await response.json()
        dispatch({ type: 'setPasswordAuthed', authed: data.success })
      }
    })
  }, [config, location.pathname])

  if (passwordLoading) {
    return null
  }

  const passwordProtected = get(config, 'passwordProtected')
  if (passwordProtected && !passwordAuthed && !isOrder) {
    return <Password />
  }

  return (
    <>
      <AdminNav only={() => localStorage.isAdmin} />
      <Switch>
        <Route path="/order/:tx" component={Order}></Route>
        <Route path="/checkout" component={Checkout}></Route>
        <Route component={Main}></Route>
      </Switch>
    </>
  )
}

export default Storefront
