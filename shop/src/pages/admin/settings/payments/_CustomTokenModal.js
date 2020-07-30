import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import Modal from 'components/Modal'

import { formInput, formFeedback } from 'utils/formHelpers'

import useTokenDataProviders from 'utils/useTokenDataProviders'

import ethers from 'ethers'

const reducer = (state, newState) => ({ ...state, ...newState })

const validate = (state) => {
  const newState = {}

  if (!state.name) {
    newState.nameError = 'Token symbol is required'
  } else if (state.name.length > 4) {
    newState.nameError = 'Token symbol too long'
  }

  if (!state.displayName) {
    newState.displayNameError = 'Display name is required'
  }

  if (!state.apiProvider) {
    newState.apiProviderError = 'Price information is required'
  }

  if (!state.address) {
    newState.addressError = 'Token address is required'
  } else if (!ethers.utils.isAddress(state.address)) {
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
              shouldClose: false,
              name: '',
              displayName: '',
              address: ''
            })
          }}
        >
          <form
            className="modal-body payment-method-modal"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              testAndAdd()
            }}
          >
            <h5>Add a custom ERC20 token</h5>

            <div className="form-group">
              <label>Token Symbol</label>
              <input {...input('name')} placeholder="eg OGN" />
              {Feedback('name')}
            </div>
            <div className="form-group">
              <label>Token Name</label>
              <input {...input('displayName')} placeholder="Origin Token" />
              {Feedback('displayName')}
            </div>
            <div className="form-group">
              <label>Token Address</label>
              <input
                {...input('address')}
                placeholder="eg 0x8207c1ffc5b6804f6024322ccf34f29c3541ae26"
              />
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
                onClick={() => setState({ shouldClose: true })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={state.saving}
              >
                {state.saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export default CustomTokenModal

require('react-styl')(`
`)
