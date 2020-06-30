import React, { useReducer, useState } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from '../payments/_ConnectModal'
import PasswordField from 'components/admin/PasswordField'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  sendgridUsername: '',
  sendgridPassword: '',
  sendgridApiKey: ''
}

const validate = (state, useBasicAuth) => {
  const newState = {}

  if (useBasicAuth) {
    if (!state.sendgridUsername) {
      newState.sendgridUsernameError = 'Username is required'
    }
    if (!state.sendgridPassword) {
      newState.sendgridPasswordError = 'Password is required'
    }
  } else {
    if (!state.sendgridApiKey) {
      newState.sendgridApiKeyError = 'API key is required'
    }
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState,
      email: 'sendgrid'
    }
  }
}

const SendgridModal = ({ onClose, initialConfig }) => {
  const [state, setState] = useReducer(reducer, {
    ...initialState,
    ...pick(initialConfig, Object.keys(initialState))
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const [useBasicAuth, setUseBasicAuth] = useState(false)

  return (
    <ConnectModal
      title="Connect to Sendgrid"
      validate={() => {
        const validateResponse = validate(state, useBasicAuth)
        setState(validateResponse.newState)
        return validateResponse
      }}
      onCancel={() => setState(initialState)}
      onClose={onClose}
    >
      <div className="form-check my-3">
        <input
          id="sendgrid_use_auth"
          className="form-check-input"
          type="checkbox"
          checked={useBasicAuth}
          onChange={(e) => setUseBasicAuth(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="sendgrid_use_auth">
          Use basic (username/password) authentication
        </label>
      </div>
      <hr />
      {useBasicAuth ? (
        <>
          <div className="form-group">
            <label>Sendgrid Username</label>
            <input type="text" {...input('sendgridUsername')} />
            {Feedback('sendgridUsername')}
          </div>
          <div className="form-group">
            <label>Sendgrid Password</label>
            <PasswordField input={input} field="sendgridPassword" />
            {Feedback('sendgridPassword')}
          </div>
        </>
      ) : (
        <div className="form-group">
          <label>Sendgrid API Key</label>
          <PasswordField input={input} field="sendgridApiKey" />
          {Feedback('sendgridApiKey')}
        </div>
      )}
    </ConnectModal>
  )
}

export default SendgridModal

require('react-styl')(`
`)
