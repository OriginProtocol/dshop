import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from './_ConnectModal'

import PasswordField from 'components/admin/PasswordField'

import useBackendApi from 'utils/useBackendApi'

import VerifyButton from '../_VerifyButton'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  paypalClientId: '',
  paypalClientSecret: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.paypalClientSecret) {
    newState.paypalClientSecretError = 'Secret key is required'
  }

  if (!state.paypalClientId) {
    newState.paypalClientIdError = 'Client ID is required'
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
      title="Connect to PayPal"
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
        <label>Client ID</label>
        <input {...input('paypalClientId')} />
        {Feedback('paypalClientId')}
      </div>
      <div className="form-group">
        <label>Secret Key</label>
        <PasswordField input={input} field="paypalClientSecret" />
        {Feedback('paypalClientSecret')}
      </div>
    </ConnectModal>
  )
}

export default PayPalModal

require('react-styl')(`
`)
