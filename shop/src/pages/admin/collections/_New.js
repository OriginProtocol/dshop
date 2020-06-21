import React from 'react'
import { useHistory } from 'react-router-dom'
import kebabCase from 'lodash/kebabCase'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConfirmationModal from 'components/ConfirmationModal'
import useSetState from 'utils/useSetState'
import useCollections from 'utils/useCollections'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'

function validate(state) {
  const newState = {}

  if (!state.title) {
    newState.titleError = 'Enter a title'
  } else if (state.title.length < 3) {
    newState.titleError = 'Title is too short'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const AdminCreateCollection = ({ className = '', children, onSuccess }) => {
  const history = useHistory()
  const [, dispatch] = useStateValue()
  const { collections } = useCollections()
  const [state, setState] = useSetState({ title: '' })
  const { post } = useBackendApi({ authToken: true })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <ConfirmationModal
      className={children ? className : `btn btn-primary px-4 ${className}`}
      buttonText={<>{children || 'Add Collection'}</>}
      confirmText="Add a Collection"
      confirmedText="Collection created"
      proceedText="Add"
      cancelText="Cancel"
      onConfirm={() => {
        return post('/collections', {
          method: 'PUT',
          body: JSON.stringify({
            collections: [
              ...collections,
              {
                id: kebabCase(state.title),
                title: state.title,
                products: []
              }
            ]
          })
        })
      }}
      validate={() => {
        const { valid, newState } = validate(state)
        setState(newState)
        return valid
      }}
      onSuccess={() => {
        setState({}, true)
        dispatch({ type: 'reload', target: 'collections' })
        if (onSuccess) {
          onSuccess()
        } else {
          history.push({
            pathname: '/admin/collections',
            state: { scrollToTop: true }
          })
        }
      }}
    >
      <div className="form-row mt-3">
        <label>Collection name</label>
        <input {...input('title')} autoFocus />
        {Feedback('title')}
      </div>
    </ConfirmationModal>
  )
}

export default AdminCreateCollection
