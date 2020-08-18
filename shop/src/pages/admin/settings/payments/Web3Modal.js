import React, { useReducer } from 'react'

import ethers from 'ethers'
import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from './_ConnectModal'

import PasswordField from 'components/admin/PasswordField'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  web3Pk: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.web3Pk) {
    newState.web3PkError = fbt(
      'Private key is required',
      'admin.settings.payments.web3.pkError'
    )
  } else {
    try {
      new ethers.Wallet('0x' + state.web3Pk)
    } catch (err) {
      console.error(err)
      newState.web3PkError = fbt(
        'Invalid private key',
        'admin.settings.payments.web3.pkInvalidError'
      )
    }
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      web3Pk: '0x' + state.web3Pk,
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
      title={fbt(
        'Connect Crypto Wallet',
        'admin.settings.payments.web3.connectWallet'
      )}
      validate={() => {
        const validateResponse = validate(state)
        setState(validateResponse.newState)
        return validateResponse
      }}
      onCancel={() => setState(initialState)}
      onClose={onClose}
    >
      <div className="form-group">
        <label>
          <fbt desc="admin.settings.payments.web3.privateKey">Private Key</fbt>
        </label>
        <PasswordField input={input} field="web3Pk" prepend="0x" />
        {Feedback('web3Pk')}
      </div>
    </ConnectModal>
  )
}

export default Web3Modal

require('react-styl')(`
`)
