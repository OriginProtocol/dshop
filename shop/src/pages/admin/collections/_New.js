import React from 'react'
import kebabCase from 'lodash/kebabCase'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConfirmationModal from 'components/ConfirmationModal'
import useSetState from 'utils/useSetState'
import useCollections from 'utils/useCollections'
import useBackendApi from 'utils/useBackendApi'
import useAutoFocus from 'utils/useAutoFocus'
import useRedirect from 'utils/useRedirect'
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
  const redirectTo = useRedirect()
  const [, dispatch] = useStateValue()
  const title = useAutoFocus()
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
      confirmedText={false}
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
          redirectTo('/admin/collections')
        }
      }}
    >
      <div className="form-row mt-3">
        <label>Collection name</label>
        <input ref={title} {...input('title')} autoFocus />
        {Feedback('title')}
      </div>
    </ConfirmationModal>
  )
}

export default AdminCreateCollection
