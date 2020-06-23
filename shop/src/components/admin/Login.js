import React, { useState } from 'react'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import SetupLayout from 'pages/super-admin/setup/_SetupLayout'
import ErrorText from 'pages/super-admin/setup/_ErrorText'

const Login = () => {
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
            .then((auth) => {
              setState({ ...state, error: '' })
              dispatch({ type: 'setAuth', auth })
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
        <div className="form-group">
          <button type="submit">Login</button>
        </div>
      </form>
    </SetupLayout>
  )
}

export default Login

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
