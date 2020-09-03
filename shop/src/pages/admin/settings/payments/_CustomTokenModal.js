import React, { useReducer } from 'react'
import ethers from 'ethers'
import fbt from 'fbt'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import { formInput, formFeedback } from 'utils/formHelpers'
import useTokenDataProviders from 'utils/useTokenDataProviders'

import Modal from 'components/Modal'

const reducer = (state, newState) => ({ ...state, ...newState })

const validate = (state) => {
  const newState = {}

  if (!state.name) {
    newState.nameError = fbt(
      'Token symbol is required',
      'admin.settings.payments.CustomTokenModal.nameError'
    )
  } else if (state.name.length > 6) {
    newState.nameError = fbt(
      'Token symbol too long',
      'admin.settings.payments.CustomTokenModal.nameLenError'
    )
  }

  if (!state.displayName) {
    newState.displayNameError = fbt(
      'Display name is required',
      'admin.settings.payments.CustomTokenModal.displayNameError'
    )
  }

  if (!state.apiProvider) {
    newState.apiProviderError = fbt(
      'Price information is required',
      'admin.settings.payments.CustomTokenModal.apiProviderError'
    )
  }

  if (!state.address) {
    newState.addressError = fbt(
      'Token address is required',
      'admin.settings.payments.CustomTokenModal.addressError'
    )
  } else if (!ethers.utils.isAddress(state.address)) {
    newState.addressError = fbt(
      'Invalid contract address',
      'admin.settings.payments.CustomTokenModal.invalidAddressError'
    )
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
        testError: fbt(
          'Failed to fetch exchange rate of the token.',
          'admin.settings.payments.CustomTokenModal.exchageRateError'
        ),
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
        +{' '}
        <fbt desc="admin.settings.payments.CustomTokenModal.addCustomToken">
          Add custom token
        </fbt>
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
            <h5>
              <fbt desc="admin.settings.payments.CustomTokenModal.addERC20Token">
                Add a custom ERC20 token
              </fbt>
            </h5>

            <div className="form-group">
              <label>
                <fbt desc="admin.settings.payments.CustomTokenModal.tokenSymbol">
                  Token Symbol
                </fbt>
              </label>
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
              <label>
                <fbt desc="admin.settings.payments.CustomTokenModal.fetchPriceFrom">
                  Fetch price from
                </fbt>
              </label>
              <select {...input('apiProvider')}>
                <option>
                  <fbt desc="SelectOne">Select one</fbt>
                </option>
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
                <fbt desc="Cancel">Cancel</fbt>
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={state.saving}
              >
                {state.saving ? (
                  <>
                    <fbt desc="Adding">Adding</fbt>...
                  </>
                ) : (
                  <fbt desc="Add">Add</fbt>
                )}
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
