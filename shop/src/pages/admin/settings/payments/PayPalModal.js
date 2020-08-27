import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from './_ConnectModal'

import PasswordField from 'components/admin/PasswordField'

import useBackendApi from 'utils/useBackendApi'

import VerifyButton from '../_VerifyButton'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  paypalClientId: '',
  paypalClientSecret: '',
  paypalWebhookHost: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.paypalClientSecret) {
    newState.paypalClientSecretError = fbt(
      'Secret key is required',
      'admin.settings.payments.paypal.clientSecretError'
    )
  }

  if (!state.paypalClientId) {
    newState.paypalClientIdError = fbt(
      'Client ID is required',
      'admin.settings.payments.paypal.clientIdError'
    )
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState,
      paypal: true
    }
  }
}

const PayPalModal = ({ onClose, initialConfig }) => {
  const [state, setState] = useReducer(reducer, {
    ...initialState,
    ...pick(initialConfig, Object.keys(initialState))
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const { post } = useBackendApi({ authToken: true })

  const verifyCredentials = () => {
    return post('/paypal/check-creds', {
      body: JSON.stringify(state)
    })
  }

  return (
    <ConnectModal
      title={fbt(
        'Connect to PayPal',
        'admin.settings.payments.paypal.connectPayPal'
      )}
      validate={() => {
        const validateResponse = validate(state)
        setState(validateResponse.newState)
        return validateResponse
      }}
      onCancel={() => setState(initialState)}
      onClose={onClose}
      actions={<VerifyButton onVerify={verifyCredentials} />}
    >
      <div className="form-group">
        <label>
          <fbt desc="admin.settings.payments.paypal.clientId">Client ID</fbt>
        </label>
        <input {...input('paypalClientId')} />
        {Feedback('paypalClientId')}
      </div>
      <div className="form-group">
        <label>
          <fbt desc="admin.settings.payments.paypal.secretKey">Secret Key</fbt>
        </label>
        <PasswordField input={input} field="paypalClientSecret" />
        {Feedback('paypalClientSecret')}
      </div>
      {process.env.NODE_ENV === 'production' ? null : (
        <div className="form-group">
          <label>Webhook Host (To test locally):</label>
          <input
            {...input('paypalWebhookHost')}
            placeholder="https://backend.dshop.originprotocol.com"
          />
          {Feedback('paypalWebhookHost')}
        </div>
      )}
    </ConnectModal>
  )
}

export default PayPalModal

require('react-styl')(`
`)
