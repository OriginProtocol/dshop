import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import Modal from 'components/Modal'

import { formInput, formFeedback } from 'utils/formHelpers'

const reducer = (state, newState) => ({ ...state, ...newState })

const validate = (state) => {
  const newState = {}

  if (!state.name) {
    newState.nameError = 'Token symbol is required'
  }

  if (!state.displayName) {
    newState.displayNameError = 'Display name is required'
  }

  if (!state.address) {
    newState.addressError = 'Token address is required'
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

const isTokenValid = async (tokenAddress) => {
  try {
    // Check if we can get price of token from CoinGecko
    let url = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?vs_currencies=usd'
    url = url + '&contract_addresses=' + tokenAddress

    const resp = await fetch(url)
    const data = await resp.json()

    return !Number.isNaN(data[tokenAddress].usd) 
  } catch (err) {
    console.error(err)
    return false
  }
}

const CustomTokenModal = ({ onNewTokenAdded }) => {
  const [state, setState] = useReducer(reducer, {
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

    const tokenValid = await isTokenValid(newState.address)

    if (!tokenValid) {
      setState({
        testError: `Failed to fetch exchange rate of the token.`,
        saving: false
      })
      return
    }

    onNewTokenAdded({
      ...pick(newState, [
        'name',
        'address',
        'displayName'
      ]),
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
      >+ Add custom token</button>
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

            {!state.testError ? null : (
              <div className="alert alert-danger my-3">
                {state.testError}
              </div>
            )}

            <div className="actions">
              <button
                className="btn btn-outline-primary mr-2"
                type="button"
                onClick={() => setState({
                  shouldClose: true
                })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={testAndAdd}
                disabled={state.saving}
              >
                {state.saving
                  ? 'Adding...'
                  : 'Add'}
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
