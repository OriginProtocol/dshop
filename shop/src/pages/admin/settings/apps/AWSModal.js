import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from '../payments/_ConnectModal'
import PasswordField from 'components/admin/PasswordField'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  awsRegion: '',
  awsAccessKey: '',
  awsAccessSecret: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.awsAccessKey) {
    newState.awsAccessKeyError = 'Access key is required'
  }

  if (!state.awsAccessSecret) {
    newState.awsAccessSecretError = 'Access secret is required'
  }

  if (!state.awsRegion) {
    newState.awsRegionError = 'Region is required'
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState,
      email: 'aws'
    }
  }
}

const AWSModal = ({ onClose, initialConfig }) => {
  const [state, setState] = useReducer(reducer, {
    ...initialState,
    ...pick(initialConfig, Object.keys(initialState))
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConnectModal
      title="Connect to AWS SES"
      validate={() => {
        const validateResponse = validate(state)
        setState(validateResponse.newState)
        return validateResponse
      }}
      onCancel={() => setState(initialState)}
      onClose={onClose}
    >
      <div className="form-group">
        <label>Region</label>
        <input {...input('awsRegion')} />
        {Feedback('awsRegion')}
      </div>
      <div className="form-group">
        <label>Access Key</label>
        <PasswordField input={input} field="awsAccessKey" />
        {Feedback('awsAccessKey')}
      </div>
      <div className="form-group">
        <label>Access Secret</label>
        <PasswordField input={input} field="awsAccessSecret" />
        {Feedback('awsAccessSecret')}
      </div>
    </ConnectModal>
  )
}

export default AWSModal

require('react-styl')(`
`)
