import React, { useReducer } from 'react'

import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConnectModal from '../payments/_ConnectModal'
import PasswordField from 'components/admin/PasswordField'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  printful: '',
  printfulAutoFulfill: true,
  shippingApi: true
}

const validate = (state) => {
  const newState = {}

  if (!state.printful) {
    newState.printfulError = fbt(
      'Secret key is required',
      'admin.settings.apps.printful.secretKeyError'
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

const PrintfulModal = ({ onClose, initialConfig }) => {
  const [state, setState] = useReducer(reducer, {
    ...initialState,
    ...pick(initialConfig, Object.keys(initialState))
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConnectModal
      title={fbt(
        'Connect to Printful',
        'admin.settings.apps.printful.connectPrintful'
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
          <fbt desc="admin.settings.apps.printful.apiKey">Printful API Key</fbt>
        </label>
        <PasswordField input={input} field="printful" />
        {Feedback('printful')}
      </div>
      <div className="form-check">
        <label className="form-check-label">
          <input
            type="checkbox"
            className="form-check-input"
            checked={state.printfulAutoFulfill}
            onChange={(e) =>
              setState({ printfulAutoFulfill: e.target.checked })
            }
          />
          <fbt desc="admin.settings.apps.printful.autoFulfillOrders">
            Auto-fulfill orders
          </fbt>
        </label>
      </div>
    </ConnectModal>
  )
}

export default PrintfulModal

require('react-styl')(`
`)
