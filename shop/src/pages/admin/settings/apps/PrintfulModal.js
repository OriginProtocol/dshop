import React, { useReducer } from 'react'

import pickBy from 'lodash/pickBy'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from '../payments/_ConnectModal'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  printful: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.printful) {
    newState.printfulError = 'Secret key is required'
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

const PrintfulModal = ({ onClose }) => {
  const [state, setState] = useReducer(reducer, initialState)

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConnectModal
      title="Connect to Printful"
      validate={() => {
        const validateResponse = validate(state)
        setState(validateResponse.newState)
        return validateResponse
      }}
      onCancel={() => setState(initialState)}
      onClose={onClose}
    >
      <div className="form-group">
        <label>Printful API Key</label>
        <input {...input('printful')} />
        {Feedback('printful')}
      </div>
    </ConnectModal>
  )
}

export default PrintfulModal

require('react-styl')(`
`)
