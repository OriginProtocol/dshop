import React, { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

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
          Your password has been updated. Please login to continue.
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
              setState({ ...state, error: 'Unauthorized' })
            })
        }}
      >
        <div className="form-group">
          <label>E-mail</label>
          <input
            type="email"
            className="form-control"
            value={state.email}
            autoFocus
            onChange={(e) => setState({ ...state, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            value={state.password}
            onChange={(e) => setState({ ...state, password: e.target.value })}
            type="password"
            className="form-control"
          />
        </div>
        <ErrorText>{state.error}</ErrorText>
        <div className="form-group mb-0">
          <button type="submit">Login</button>
        </div>
      </form>
      {!publicSignups ? null : (
        <div className="actions">
          Don&apos;t yet have an account?
          <Link className="ml-2" to="/admin/signup" children="Sign Up" />
          <br />
          Forgot password?
          <Link
            className="ml-2"
            to="/admin/forgot-password"
            children="Click here"
          />
        </div>
      )}
    </SetupLayout>
  )
}

export default Login
