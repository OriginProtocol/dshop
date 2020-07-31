import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import SetupLayout from 'pages/super-admin/setup/_SetupLayout'
import ErrorText from 'pages/super-admin/setup/_ErrorText'
import SignUp from 'pages/super-admin/setup/SignUp'

const LoginSignup = () => {
  const [{ admin }] = useStateValue()
  const [mode, setMode] = useState('login')

  const publicSignups = get(admin, 'publicSignups', false)
  if (!publicSignups) {
    return <Login />
  }

  return mode === 'sign-up' ? (
    <SetupLayout>
      <div className="mt-3">
        <SignUp url="/register" />
      </div>
      <div className="actions">
        Already have an account?
        <a
          className="ml-2"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setMode('login')
          }}
          children="Login"
        />
      </div>
    </SetupLayout>
  ) : mode === 'forgot-pass' ? (
    <ForgotPass setMode={setMode} />
  ) : (
    <Login setMode={setMode} />
  )
}

const Login = ({ setMode }) => {
  const history = useHistory()
  const [state, setState] = useState({ email: '', password: '', error: '' })
  const [, dispatch] = useStateValue()
  const { post } = useBackendApi()

  return (
    <SetupLayout>
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
      {!setMode ? null : (
        <div className="actions">
          Don&apos;t yet have an account?
          <a
            className="ml-2"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setMode('sign-up')
            }}
            children="Sign Up"
          />
          <br />
          Forgot password?
          <a
            className="ml-2"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setMode('forgot-pass')
            }}
            children="Click here"
          />
        </div>
      )}
    </SetupLayout>
  )
}

const ForgotPass = ({ setMode }) => {
  const [state, setState] = useState({ email: '', error: '' })
  const { post } = useBackendApi()

  return (
    <SetupLayout>
      <form
        className="admin login"
        onSubmit={(e) => {
          e.preventDefault()
          setState({ ...state, error: '' })
          const body = JSON.stringify({ email: state.email })
          post('/auth/forgot-pass', { body })
            .then(() => {
              setState({ ...state, error: '' })
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
        <ErrorText>{state.error}</ErrorText>
        <div className="form-group mb-0">
          <button type="submit">Reset password</button>
        </div>
      </form>
      {!setMode ? null : (
        <div className="actions">
          <a
            className="ml-2"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setMode('login')
            }}
            children="Back to Login"
          />
        </div>
      )}
    </SetupLayout>
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
