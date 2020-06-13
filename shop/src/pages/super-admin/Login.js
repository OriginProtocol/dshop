import React, { useState } from 'react'

import { DshopLogo } from 'components/icons/Admin'

import useConfig from 'utils/useConfig'
import SetupLayout from './setup/_SetupLayout'
import { formGroupStyles } from './setup/_formStyles'
import Button from './setup/_Button'
import ErrorText from './setup/_ErrorText'

const Login = ({ next }) => {
  const { config } = useConfig()
  const [state, setState] = useState({
    email: '',
    password: '',
    error: ''
  })

  return (
    <SetupLayout>
      <div className="admin-first-time login-form">
        <div className="desc">Welcome to Dshop! Sign in to continue.</div>
        <form
          onSubmit={(e) => {
            e.preventDefault()

            const { email, password } = state
            fetch(`${config.backend}/superuser/login`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ email, password })
            })
              .then(async (res) => {
                if (res.ok) {
                  setState({ ...state, error: '' })
                  // const auth = await res.json()
                  next()
                } else {
                  setState({ ...state, error: 'Unauthorized' })
                }
              })
              .catch((err) => {
                console.error('Error signing in', err)
                setState({ ...state, error: 'Unauthorized' })
              })
          }}
        >
          <div className="form-group">
            <input
              autoFocus
              type="email"
              className="form-control"
              placeholder="E-mail"
              value={state.email}
              onChange={(e) => setState({ ...state, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <input
              value={state.password}
              onChange={(e) => setState({ ...state, password: e.target.value })}
              type="password"
              className="form-control"
              placeholder="Password"
            />
            <ErrorText>{state.error}</ErrorText>
          </div>
          <Button type="submit" className="btn btn-primary mt-2 px-4">
            Login
          </Button>
        </form>
      </div>
    </SetupLayout>
  )
}

export default Login

require('react-styl')(`
  ${formGroupStyles('.login-form .form-group')}
  .login-form
    .desc 
      font-size: 1.125rem
      text-align: center
      color: #ffffff
      margin-bottom: 1.5rem

    form
      width: 500px
      border-radius: 5px
      margin: 1rem auto
      box-shadow: 1px 1px 0 0 #006ee3, -1px -1px 0 0 #0e83ff
      background-image: linear-gradient(313deg, #007cff 100%, #0076f4 7%)
      padding: 2rem 2.5rem

  `)
