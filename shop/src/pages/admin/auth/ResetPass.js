import React, { useReducer } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import queryString from 'query-string'

import { formInput, formFeedback } from 'utils/formHelpers'
import useBackendApi from 'utils/useBackendApi'
import SetupLayout from 'pages/super-admin/setup/_SetupLayout'
import Link from 'components/Link'

const reducer = (state, newState) => ({ ...state, ...newState })

function validate(state) {
  const newState = {}

  if (!state.password) {
    newState.passwordError = 'Must enter a password'
  } else if (state.password.length < 6) {
    newState.passwordError = 'Password is too short'
  } else if (state.password !== state.passwordConfirmation) {
    newState.passwordConfirmationError = 'Password confirmation does not match'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const ResetPass = () => {
  const location = useLocation()
  const history = useHistory()
  const opts = queryString.parse(location.search)
  const [state, setState] = useReducer(reducer, {
    password: '',
    passwordConfirmation: ''
  })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const { post } = useBackendApi()

  return (
    <SetupLayout>
      <form
        autoComplete="off"
        className="admin login"
        onSubmit={(e) => {
          e.preventDefault()

          const { valid, newState } = validate(state)
          setState(newState)

          if (!valid) {
            return
          }

          const body = JSON.stringify({
            code: opts.code,
            password: state.password
          })
          post('/reset-password', { body, suppressError: true }).then(
            (json) => {
              if (json.success) {
                history.push('/admin/login?newPassword')
              } else {
                setState({ passwordError: json.error })
              }
            }
          )
        }}
      >
        <div className="form-group">
          <label>New Password</label>
          <input type="password" {...input('password')} />
          {Feedback('password')}
        </div>
        <div className="form-group">
          <label>Password Confirmation</label>
          <input type="password" {...input('passwordConfirmation')} />
          {Feedback('passwordConfirmation')}
        </div>
        <div className="form-group mb-0">
          <button type="submit">Reset password</button>
        </div>
      </form>
      <div className="actions">
        <Link className="ml-2" to="/admin/login" children="Back to Login" />
      </div>
    </SetupLayout>
  )
}

export default ResetPass
