import React, { useReducer } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import queryString from 'query-string'

import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import useBackendApi from 'utils/useBackendApi'
import SetupLayout from 'pages/super-admin/setup/_SetupLayout'
import Link from 'components/Link'

const reducer = (state, newState) => ({ ...state, ...newState })

function validate(state) {
  const newState = {}

  if (!state.password) {
    newState.passwordError = fbt(
      'Must enter a password',
      'admin.auth.resetpass.passwordError'
    )
  } else if (state.password.length < 6) {
    newState.passwordError = fbt(
      'Password is too short',
      'admin.auth.resetpass.passwordLenError'
    )
  } else if (state.password !== state.passwordConfirmation) {
    newState.passwordConfirmationError = fbt(
      'Password confirmation does not match',
      'admin.auth.resetpass.passwordConfirmationError'
    )
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
          <label>
            <fbt desc="admin.auth.resetpass.newPassword">New Password</fbt>
          </label>
          <input type="password" {...input('password')} />
          {Feedback('password')}
        </div>
        <div className="form-group">
          <label>
            <fbt desc="admin.auth.resetpass.passwordConfirmation">
              Password Confirmation
            </fbt>
          </label>
          <input type="password" {...input('passwordConfirmation')} />
          {Feedback('passwordConfirmation')}
        </div>
        <div className="form-group mb-0">
          <button type="submit">
            <fbt desc="admin.auth.resetpass.resetPassword">Reset password</fbt>
          </button>
        </div>
      </form>
      <div className="actions">
        <Link
          className="ml-2"
          to="/admin/login"
          children={
            <fbt desc="admin.auth.resetpass.backToLogin">Back to Login</fbt>
          }
        />
      </div>
    </SetupLayout>
  )
}

export default ResetPass
