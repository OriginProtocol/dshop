import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from '../payments/_ConnectModal'
import PasswordField from 'components/admin/PasswordField'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  mailgunSmtpServer: '',
  mailgunSmtpPort: '',
  mailgunSmtpLogin: '',
  mailgunSmtpPassword: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.mailgunSmtpServer) {
    newState.mailgunSmtpServerError = fbt(
      'Hostname is required',
      'admin.settings.apps.mailgun.smtpServerError'
    )
  }

  if (!state.mailgunSmtpPort) {
    newState.mailgunSmtpPortError = fbt(
      'Port is required',
      'admin.settings.apps.mailgun.smtpPortError'
    )
  }

  if (!state.mailgunSmtpLogin) {
    newState.mailgunSmtpLoginError = fbt(
      'Username is required',
      'admin.settings.apps.mailgun.smtpLoginError'
    )
  }

  if (!state.mailgunSmtpPassword) {
    newState.mailgunSmtpPasswordError = fbt(
      'Password is required',
      'admin.settings.apps.mailgun.smtpPasswordError'
    )
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
      title={fbt(
        'Connect to Mailgun',
        'admin.settings.apps.mailgun.connectMailgun'
      )}
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
        <label>
          <fbt desc="admin.settings.apps.mailgun.serverHost">Server Host</fbt>
        </label>
        <input {...input('mailgunSmtpServer')} />
        {Feedback('mailgunSmtpServer')}
      </div>
      <div className="form-group">
        <label>
          <fbt desc="Port">Port</fbt>
        </label>
        <input {...input('mailgunSmtpPort')} type="number" min="1" />
        {Feedback('mailgunSmtpPort')}
      </div>
      <div className="form-group">
        <label>
          <fbt desc="Username">Username</fbt>
        </label>
        <input {...input('mailgunSmtpLogin')} />
        {Feedback('mailgunSmtpLogin')}
      </div>
      <div className="form-group">
        <label>
          <fbt desc="Password">Password</fbt>
        </label>
        <PasswordField input={input} field="mailgunSmtpPassword" />
        {Feedback('mailgunSmtpPassword')}
      </div>
    </ConnectModal>
  )
}

export default MailgunModal

require('react-styl')(`
`)
