import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from '../payments/_ConnectModal'
import PasswordField from 'components/admin/PasswordField'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  fromEmail: '',
  mailgunSmtpServer: '',
  mailgunSmtpPort: '',
  mailgunSmtpLogin: '',
  mailgunSmtpPassword: ''
}

const emailRegex = /^[a-z0-9-._+]+@[a-z0-9-]+(\.[a-z]+)*(\.[a-z]{2,})$/i

const validate = (state) => {
  const newState = {}

  if (!state.mailgunSmtpServer) {
    newState.mailgunSmtpServerError = 'Hostname is required'
  }

  if (!state.mailgunSmtpPort) {
    newState.mailgunSmtpPortError = 'Port is required'
  }

  if (!state.mailgunSmtpLogin) {
    newState.mailgunSmtpLoginError = 'Username is required'
  }

  if (!state.mailgunSmtpPassword) {
    newState.mailgunSmtpPasswordError = 'Password is required'
  }

  if (!state.fromEmail) {
    newState.fromEmailError = 'Email address is required'
  } else if (!emailRegex.test(state.fromEmail)) {
    newState.fromEmailError = 'Should be a valid email address'
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState,
      email: 'mailgun'
    }
  }
}

const MailgunModal = ({ onClose, initialConfig, overrideOnConnect }) => {
  const [state, setState] = useReducer(reducer, {
    ...initialState,
    ...pick(initialConfig, Object.keys(initialState))
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConnectModal
      title="Connect to Mailgun"
      validate={() => {
        const validateResponse = validate(state)
        setState(validateResponse.newState)
        return validateResponse
      }}
      onCancel={() => setState(initialState)}
      onClose={onClose}
      overrideOnConnect={overrideOnConnect}
    >
      <div className="form-group">
        <label>Server Host</label>
        <input {...input('mailgunSmtpServer')} />
        {Feedback('mailgunSmtpServer')}
      </div>
      <div className="form-group">
        <label>Port</label>
        <input {...input('mailgunSmtpPort')} type="number" min="1" />
        {Feedback('mailgunSmtpPort')}
      </div>
      <div className="form-group">
        <label>Username</label>
        <input {...input('mailgunSmtpLogin')} />
        {Feedback('mailgunSmtpLogin')}
      </div>
      <div className="form-group">
        <label>Password</label>
        <PasswordField input={input} field="mailgunSmtpPassword" />
        {Feedback('mailgunSmtpPassword')}
      </div>
      <div className="form-group">
        <label>Send emails from</label>
        <input {...input('fromEmail')} type="email" />
        {Feedback('fromEmail')}
      </div>
    </ConnectModal>
  )
}

export default MailgunModal

require('react-styl')(`
`)
