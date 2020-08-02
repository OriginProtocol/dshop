import React, { useState } from 'react'

import useBackendApi from 'utils/useBackendApi'
import SetupLayout from 'pages/super-admin/setup/_SetupLayout'
import ErrorText from 'pages/super-admin/setup/_ErrorText'
import Link from 'components/Link'

const ForgotPass = () => {
  const [state, setState] = useState({ email: '', error: '' })
  const { post } = useBackendApi()

  return (
    <SetupLayout>
      <form
        autoComplete="off"
        className="admin login"
        onSubmit={(e) => {
          e.preventDefault()
          setState({ ...state, error: '' })
          const body = JSON.stringify({ email: state.email })
          post('/forgot-password', { body })
            .then(() => {
              setState({ ...state, error: '', sentLink: true })
            })
            .catch((err) => {
              console.error('Error signing in', err)
              setState({ ...state, error: 'Unauthorized' })
            })
        }}
      >
        {state.sentLink ? (
          <div className="actions">
            Please check your email for a link to reset your password.
          </div>
        ) : (
          <>
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
          </>
        )}
      </form>
      <div className="actions">
        <Link className="ml-2" to="/admin/login" children="Back to Login" />
      </div>
    </SetupLayout>
  )
}

export default ForgotPass
