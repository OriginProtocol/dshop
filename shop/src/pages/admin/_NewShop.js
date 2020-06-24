import React, { useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import kebabCase from 'lodash/kebabCase'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConfirmationModal from 'components/ConfirmationModal'
import useSetState from 'utils/useSetState'
import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

function validate(state) {
  const newState = {}

  if (!state.name) {
    newState.nameError = 'Enter a title'
  } else if (state.name.length < 3) {
    newState.nameError = 'Title is too short'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const defaultState = { title: '' }

const AdminNewShop = ({ shouldShow, onClose = () => {} }) => {
  const shopName = useCallback((node) => {
    if (node !== null) {
      setTimeout(() => node.focus(), 50)
    }
  }, [])
  const history = useHistory()
  const [, dispatch] = useStateValue()
  const { setActiveShop } = useConfig()
  const [state, setState] = useSetState(defaultState)
  const { post } = useBackendApi({ authToken: true })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConfirmationModal
      confirmText="Add a new shop"
      confirmedText={false}
      proceedText="Add"
      cancelText="Cancel"
      loadingText="Creating Shop..."
      modalOnly={true}
      shouldShow={shouldShow}
      onClose={() => {
        setState(defaultState, true)
        onClose()
      }}
      onConfirm={() =>
        post('/shop', {
          method: 'POST',
          suppressError: true,
          body: JSON.stringify({
            shopType: 'empty',
            name: state.name,
            backend: get(window, 'location.origin'),
            dataDir: kebabCase(state.name),
            hostname: kebabCase(state.name)
          })
        })
      }
      onError={(json) => {
        console.log(json)
        setState({ nameError: json.message })
      }}
      validate={() => {
        const { valid, newState } = validate(state)
        setState(newState)
        return valid
      }}
      onSuccess={(json) => {
        setState({}, true)
        setActiveShop(json.slug)
        setTimeout(() => {
          dispatch({ type: 'reset', dataDir: json.slug })
        }, 50)
        history.push({
          pathname: '/admin/onboarding',
          state: { scrollToTop: true }
        })
      }}
    >
      <div className="form-row mt-3">
        <label>Shop name</label>
        <input ref={shopName} {...input('name')} />
        {Feedback('name')}
      </div>
    </ConfirmationModal>
  )
}

export default AdminNewShop
