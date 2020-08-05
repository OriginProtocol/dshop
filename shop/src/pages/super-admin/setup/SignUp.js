import React from 'react'
import pick from 'lodash/pick'

import useBackendApi from 'utils/useBackendApi'
import { formInput, formFeedback } from 'utils/formHelpers'
import { useStateValue } from 'data/state'
import useSetState from 'utils/useSetState'
import ErrorText from './_ErrorText'

const emailRegex = /^[a-z0-9-._+]+@[a-z0-9-]+(\.[a-z]+)*(\.[a-z]{2,})$/i

function validate(state) {
  const newState = {}

  if (!state.name) {
    newState.nameError = 'Please enter a name'
  } else if (state.name.length < 3) {
    newState.nameError = 'Name is too short'
  }

  if (!state.email) {
    newState.emailError = 'Please enter an email address'
  } else if (!emailRegex.test(state.email)) {
    newState.emailError = 'Please enter a valid email address'
  }

  if (!state.password) {
    newState.passwordError = 'Please enter a password'
  } else if (state.password.length < 6) {
    newState.passwordError = 'Password is too short'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const SignUp = ({ url = '/auth/registration' }) => {
  const [, dispatch] = useStateValue()
  const { post } = useBackendApi()
  const [state, setState] = useSetState({
    name: '',
    email: '',
    password: '',
    error: ''
  })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <div className="signup-form">
      <div className="actions">Get started by creating a Dshop account.</div>
      <form
        className="sign-up"
        onSubmit={(e) => {
          e.preventDefault()

          const { valid, newState } = validate(state)
          setState(newState)
          if (!valid) {
            return
          }

          const body = JSON.stringify(pick(state, 'name', 'email', 'password'))

          post(url, { body, suppressError: true })
            .then((jsonData) => {
              if (jsonData.success) {
                setState({ ...state, error: '' })
                dispatch({ type: 'reload', target: 'auth' })
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
          <label>Name</label>
          <input autoFocus {...input('name')} />
          {Feedback('name')}
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" {...input('email')} />
          {Feedback('email')}
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" {...input('password')} />
          {Feedback('password')}
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
