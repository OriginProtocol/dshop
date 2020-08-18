import React, { useReducer } from 'react'

import pickBy from 'lodash/pickBy'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from './_ConnectModal'

import PasswordField from 'components/admin/PasswordField'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  upholdApi: '',
  upholdClient: '',
  upholdSecret: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.upholdApi) {
    newState.upholdApiError = 'Select an environment'
  }

  if (!state.upholdClient) {
    newState.upholdClientError = 'Client Key is required'
  }

  if (!state.upholdSecret) {
    newState.upholdSecretError = 'Client Secret is required'
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState
    }
  }
}

const UpholdModal = ({ onClose, initialConfig }) => {
  const [state, setState] = useReducer(reducer, {
    ...initialState,
    ...initialConfig
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConnectModal
      title="Connect to Uphold"
      validate={() => {
        const validateResponse = validate(state)
        setState(validateResponse.newState)
        return validateResponse
      }}
      onCancel={() => setState(initialState)}
      onClose={onClose}
    >
      <div className="form-group">
        <label>Environment</label>
        <select {...input('upholdApi')}>
          <option>Select one</option>
          <option value="sandbox">Sandbox</option>
          <option value="production">Production</option>
        </select>
        {Feedback('upholdApi')}
      </div>
      <div className="form-group">
        <label>Client Key</label>
        <PasswordField input={input} field="upholdClient" />
        {Feedback('upholdClient')}
      </div>
      <div className="form-group">
        <label>Client Secret</label>
        <PasswordField input={input} field="upholdSecret" />
        {Feedback('upholdSecret')}
      </div>
    </ConnectModal>
  )
}

export default UpholdModal

require('react-styl')(`
`)
