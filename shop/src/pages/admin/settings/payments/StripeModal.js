import React, { useReducer } from 'react'

import pickBy from 'lodash/pickBy'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from './_ConnectModal'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  stripeBackend: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.stripeBackend) {
    newState.stripeBackendError = 'Secret key is required'
  }

  if (!state.stripeKey) {
    newState.stripeKeyError = 'Client key is required'
  }

  if (!state.stripeWebhookSecret) {
    newState.stripeWebhookSecretError = 'Webhook secret key is required'
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

const StripeModal = ({ onClose }) => {
  const [state, setState] = useReducer(reducer, initialState)

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

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
    >
      <div className="form-group">
        <label>Stripe Public Key</label>
        <input {...input('stripeKey')} />
        {Feedback('stripeKey')}
      </div>
      <div className="form-group">
        <label>Stripe Secret Key</label>
        <input {...input('stripeBackend')} />
        {Feedback('stripeBackend')}
      </div>
      <div className="form-group">
        <label>Stripe Webhook Key</label>
        <input {...input('stripeWebhookSecret')} />
        {Feedback('stripeWebhookSecret')}
      </div>
    </ConnectModal>
  )
}

export default StripeModal

require('react-styl')(`
`)
