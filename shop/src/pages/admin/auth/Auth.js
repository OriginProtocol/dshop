import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import Login from './Login'
import SignUp from './SignUp'
import ForgotPass from './ForgotPass'
import ResetPass from './ResetPass'

const LoginSignup = () => {
  const [{ admin }] = useStateValue()

  const publicSignups = get(admin, 'publicSignups', false)
  if (!publicSignups) {
    return <Login />
  }

  return (
    <Switch>
      <Route path="/admin/login">
        <Login publicSignups={true} />
      </Route>
      <Route path="/admin/forgot-password">
        <ForgotPass />
      </Route>
      <Route path="/admin/reset-password">
        <ResetPass />
      </Route>
      <Route path="/admin/signup">
        <SignUp />
      </Route>
      <Redirect to="/admin/login" />
    </Switch>
  )
}

export default LoginSignup

require('react-styl')(`
  .admin.login
    width: 500px
    border-radius: 5px
    margin: 3rem auto 1rem auto
    box-shadow: 1px 1px 0 0 #006ee3, -1px -1px 0 0 #0e83ff
    background-image: linear-gradient(313deg, #007cff 100%, #0076f4 7%)
    padding: 2rem 2.5rem
    min-height: auto
`)
