import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import SetupLayout from 'pages/super-admin/setup/_SetupLayout'
import ErrorText from 'pages/super-admin/setup/_ErrorText'
import SignUp from 'pages/super-admin/setup/SignUp'

const LoginSignup = () => {
  const [{ admin }] = useStateValue()
  const [showSignup, setShowSignup] = useState()

  const publicSignups = get(admin, 'publicSignups', false)
  if (!publicSignups) {
    return <Login />
  }

  return showSignup ? (
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
            setShowSignup(false)
          }}
          children="Login"
        />
      </div>
    </SetupLayout>
  ) : (
    <Login onToggle={() => setShowSignup(true)} />
  )
}

const Login = ({ onToggle }) => {
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
      {!onToggle ? null : (
        <div className="actions">
          Don&apos;t yet have an account?
          <a
            className="ml-2"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onToggle()
            }}
            children="Sign Up"
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
