import React from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

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
  const history = useHistory()
  const [, dispatch] = useStateValue()
  const { setDataSrc } = useConfig()
  const [state, setState] = useSetState(defaultState)
  const { post } = useBackendApi({ authToken: true })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConfirmationModal
      confirmText="Add a new shop"
      confirmedText="Shop created"
      proceedText="Add"
      cancelText="Cancel"
      modalOnly={true}
      shouldShow={shouldShow}
      onClose={() => {
        setState(defaultState, true)
        onClose()
      }}
      onConfirm={() =>
        post('/shop', {
          method: 'POST',
          body: JSON.stringify({
            shopType: 'empty',
            name: state.name,
            backend: get(window, 'location.origin'),
            dataDir: state.name
              .toLowerCase()
              .trim()
              .replace(/[^0-9a-z- ]/g, '')
              .replace(/ +/g, '-')
          })
        })
      }
      validate={() => {
        const { valid, newState } = validate(state)
        setState(newState)
        return valid
      }}
      onSuccess={(json) => {
        setState({}, true)
        localStorage.activeShop = json.slug
        setDataSrc(`${json.slug}/`)
        dispatch({ type: 'reload', target: 'auth' })
        dispatch({ type: 'reset', dataDir: json.slug })
        history.push({
          pathname: '/admin/onboarding',
          state: { scrollToTop: true }
        })
      }}
    >
      <div className="form-row mt-3">
        <label>Shop name</label>
        <input {...input('name')} autoFocus autoComplete="off" />
        {Feedback('name')}
      </div>
    </ConfirmationModal>
  )
}

export default AdminNewShop
