import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import {
  validateStripeKeys,
  validatePublishableKey,
  validateSecretKey
} from '@origin/utils/stripe'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from './_ConnectModal'

import PasswordField from 'components/admin/PasswordField'

import useBackendApi from 'utils/useBackendApi'

import VerifyButton from '../_VerifyButton'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  stripeKey: '',
  stripeBackend: '',
  stripeWebhookSecret: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.stripeBackend || !validateSecretKey(state.stripeBackend)) {
    newState.stripeBackendError = 'Secret key is required'
  }

  if (!state.stripeKey || !validatePublishableKey(state.stripeKey)) {
    newState.stripeKeyError = 'Client key is required'
  }

  // Validate them as a pair
  if (
    !newState.stripeKeyError &&
    !newState.stripeBackendError &&
    !validateStripeKeys({
      publishableKey: state.stripeKey,
      secretKey: state.stripeBackend
    })
  ) {
    newState.stripeKeyError = "Stripe keys don't match"
    newState.stripeBackendError = "Stripe keys don't match"
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState,
      stripe: true
    }
  }
}

const StripeModal = ({ onClose, initialConfig }) => {
  const [state, setState] = useReducer(reducer, {
    ...initialState,
    ...pick(initialConfig, Object.keys(initialState))
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const { post } = useBackendApi({ authToken: true })

  const verifyCredentials = () => {
    return post('/stripe/check-creds', {
      body: JSON.stringify(state)
    })
  }

  return (
    <ConnectModal
      title="Connect to Stripe"
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
        <label>Stripe Public Key</label>
        <input {...input('stripeKey')} />
        {Feedback('stripeKey')}
      </div>
      <div className="form-group">
        <label>Stripe Secret Key</label>
        <PasswordField input={input} field="stripeBackend" />
        {Feedback('stripeBackend')}
      </div>
      {process.env.NODE_ENV === 'production' ? null : (
        <div className="form-group">
          <label>Stripe Webhook Key</label>
          <PasswordField input={input} field="stripeWebhookSecret" />
          {Feedback('stripeWebhookSecret')}
        </div>
      )}
    </ConnectModal>
  )
}

export default StripeModal

require('react-styl')(`
`)
