import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import Modal from 'components/Modal'

import { formInput, formFeedback } from 'utils/formHelpers'

import useTokenDataProviders from 'utils/useTokenDataProviders'

import Web3 from 'web3'
const web3 = new Web3()

const reducer = (state, newState) => ({ ...state, ...newState })

const validate = (state) => {
  const newState = {}

  if (!state.name) {
    newState.nameError = 'Token symbol is required'
  }

  if (!state.displayName) {
    newState.displayNameError = 'Display name is required'
  }

  if (!state.apiProvider) {
    newState.apiProviderError = 'Price information is required'
  }

  if (!state.address) {
    newState.addressError = 'Token address is required'
  } else if (!web3.utils.isAddress(state.address)) {
    newState.addressError = 'Invalid contract address'
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

const isTokenValid = async (token, tokenDataProviders) => {
  try {
    const provider = tokenDataProviders.find(
      (provider) => provider.id === token.apiProvider
    )

    if (!provider) {
      console.error('Invalid provider', token, tokenDataProviders)
      return false
    }

    const priceData = await provider.getTokenPrices(token)
    const tokenPrice = priceData[token.name]

    return typeof tokenPrice === 'number' && !Number.isNaN(tokenPrice)
  } catch (err) {
    console.error(err)
    return false
  }
}

const CustomTokenModal = ({ onNewTokenAdded }) => {
  const { tokenDataProviders } = useTokenDataProviders()

  const [state, setState] = useReducer(reducer, {
    apiProvider: tokenDataProviders[0].id,
    showModal: false,
    shouldClose: false
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const testAndAdd = async () => {
    const { valid, newState } = validate(state)

    setState(newState)

    if (!valid) return

    setState({ saving: true })

    const tokenValid = await isTokenValid(newState, tokenDataProviders)

    if (!tokenValid) {
      setState({
        testError: `Failed to fetch exchange rate of the token.`,
        saving: false
      })
      return
    }

    onNewTokenAdded({
      ...pick(newState, ['name', 'address', 'displayName', 'apiProvider']),
      id: `token-${newState.name.toUpperCase()}`
    })

    setState({
      name: '',
      displayName: '',
      address: '',
      saving: false,
      shouldClose: true
    })
  }

  return (
    <>
      <button
        className="btn btn-outline-primary"
        type="button"
        onClick={() => setState({ showModal: true })}
      >
        + Add custom token
      </button>
      {!state.showModal ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            setState({
              showModal: false,
              shouldClose: false
            })
          }}
        >
          <div className="modal-body payment-method-modal">
            <h5>Add a custom ERC20 token</h5>

            <div className="form-group">
              <label>Token Symbol</label>
              <input {...input('name')} />
              {Feedback('name')}
            </div>
            <div className="form-group">
              <label>Token Name</label>
              <input {...input('displayName')} />
              {Feedback('displayName')}
            </div>
            <div className="form-group">
              <label>Token Address</label>
              <input {...input('address')} />
              {Feedback('address')}
            </div>

            <div className="form-group">
              <label>Fetch price from</label>
              <select {...input('apiProvider')}>
                <option>Select one</option>
                {tokenDataProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {!state.testError ? null : (
              <div className="alert alert-danger my-3">{state.testError}</div>
            )}

            <div className="actions">
              <button
                className="btn btn-outline-primary mr-2"
                type="button"
                onClick={() =>
                  setState({
                    shouldClose: true
                  })
                }
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={testAndAdd}
                disabled={state.saving}
              >
                {state.saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CustomTokenModal

require('react-styl')(`
`)
