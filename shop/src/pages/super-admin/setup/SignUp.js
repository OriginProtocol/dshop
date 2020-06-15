import React, { useState } from 'react'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import ErrorText from './_ErrorText'

const SignUp = () => {
  const { config } = useConfig()
  const [, dispatch] = useStateValue()
  const [state, setState] = useState({
    name: '',
    email: '',
    password: '',
    error: ''
  })

  return (
    <div className="signup-form">
      <div className="desc">
        Start your free store in under 5 minutes. Get started now!
      </div>
      <form
        className="sign-up"
        onSubmit={(e) => {
          e.preventDefault()

          const body = JSON.stringify({
            name: state.name,
            email: state.email,
            password: state.password
          })

          fetch(`${config.backend}/auth/registration`, {
            method: 'POST',
            headers: {
              authorization: `bearer ${config.backendAuthToken}`,
              'content-type': 'application/json'
            },
            credentials: 'include',
            body
          })
            .then(async (res) => {
              if (res.ok) {
                setState({ ...state, error: '' })
                dispatch({ type: 'reload', target: 'auth' })
              } else {
                const jsonData = await res.json()
                setState({ ...state, error: jsonData.message })
              }
            })
            .catch((err) => {
              console.error('Error signing in', err)
              setState({ ...state, error: 'Unauthorized' })
            })
        }}
      >
        <div className="form-group">
          <label>Name</label>
          <input
            autoFocus
            className="form-control"
            value={state.name}
            onChange={(e) => setState({ ...state, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            className="form-control"
            value={state.email}
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
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default SignUp

require('react-styl')(`
  .signup-form
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
