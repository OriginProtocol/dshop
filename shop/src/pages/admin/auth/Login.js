import React, { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import fbt from 'fbt'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import SetupLayout from 'pages/super-admin/setup/_SetupLayout'
import ErrorText from 'pages/super-admin/setup/_ErrorText'
import Link from 'components/Link'

const Login = ({ publicSignups }) => {
  const history = useHistory()
  const location = useLocation()
  const [state, setState] = useState({ email: '', password: '', error: '' })
  const [, dispatch] = useStateValue()
  const { post } = useBackendApi()

  const changedPw = location.search.indexOf('newPassword') > 0

  return (
    <SetupLayout>
      {!changedPw ? null : (
        <div
          className="actions"
          style={{ marginTop: '1rem', marginBottom: '-2rem ' }}
        >
          <fbt desc="admin.auth.login.passwordUpdated">
            Your password has been updated. Please login to continue.
          </fbt>
        </div>
      )}
      <form
        className="admin login"
        onSubmit={(e) => {
          e.preventDefault()
          setState({ ...state, error: '' })
          const body = JSON.stringify({
            email: state.email,
            password: state.password
          })
          post('/auth/login', { body })
            .then(() => {
              setState({ ...state, error: '' })
              dispatch({ type: 'reload', target: 'auth' })
              history.push('/admin')
            })
            .catch((err) => {
              console.error('Error signing in', err)
              setState({ ...state, error: fbt('Unauthorized', 'Unauthorized') })
            })
        }}
      >
        <div className="form-group">
          <label>
            <fbt desc="Email">Email</fbt>
          </label>
          <input
            type="email"
            className="form-control"
            value={state.email}
            autoFocus
            onChange={(e) => setState({ ...state, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>
            <fbt desc="Password">Password</fbt>
          </label>
          <input
            value={state.password}
            onChange={(e) => setState({ ...state, password: e.target.value })}
            type="password"
            className="form-control"
          />
        </div>
        <ErrorText>{state.error}</ErrorText>
        <div className="form-group mb-0">
          <button type="submit">
            <fbt desc="Login">Login</fbt>
          </button>
        </div>
      </form>
      {!publicSignups ? null : (
        <div className="actions">
          <fbt desc="admin.auth.login.noAccountYet">
            Don&apos;t yet have an account?
          </fbt>
          <Link
            className="ml-2"
            to="/admin/signup"
            children={<fbt desc="SignUp">Sign Up</fbt>}
          />
          <br />
          <fbt desc="admin.auth.login.forgotPassword">Forgot password?</fbt>
          <Link
            className="ml-2"
            to="/admin/forgot-password"
            children={<fbt desc="ClickHere">Click here</fbt>}
          />
        </div>
      )}
    </SetupLayout>
  )
}

export default Login
