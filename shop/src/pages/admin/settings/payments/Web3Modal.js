import React, { useReducer } from 'react'

import pickBy from 'lodash/pickBy'
import ethers from 'ethers'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from './_ConnectModal'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  web3Pk: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.web3Pk) {
    newState.web3PkError = 'Private key is required'
  } else {
    try {
      new ethers.Wallet(state.web3Pk)
    } catch (err) {
      console.error(err)
      newState.web3PkError = 'Invalid private key'
    }
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

const Web3Modal = ({ onClose }) => {
  const [state, setState] = useReducer(reducer, initialState)

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConnectModal
      title="Connect Web3 Wallet"
      validate={() => {
        const validateResponse = validate(state)
        setState(validateResponse.newState)
        return validateResponse
      }}
      onCancel={() => setState(initialState)}
      onClose={onClose}
    >
      <div className="form-group">
        <label>Private Key</label>
        <input {...input('web3Pk')} />
        {Feedback('web3Pk')}
      </div>
    </ConnectModal>
  )
}

export default Web3Modal

require('react-styl')(`
`)
