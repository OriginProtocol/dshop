import React from 'react'
import kebabCase from 'lodash/kebabCase'
import get from 'lodash/get'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConfirmationModal from 'components/ConfirmationModal'
import useSetState from 'utils/useSetState'
import useCollections from 'utils/useCollections'
import useBackendApi from 'utils/useBackendApi'
import useAutoFocus from 'utils/useAutoFocus'
import useRedirect from 'utils/useRedirect'
import { useStateValue } from 'data/state'

function validate(state, collections) {
  const newState = {}

  if (!state.title) {
    newState.titleError = 'Enter a name'
  } else if (state.title.length < 3) {
    newState.titleError = 'Name is too short'
  }

  if (
    collections.find((c) => c.title.toLowerCase() === state.title.toLowerCase())
  ) {
    newState.titleError = 'Collection with that name already exists'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const AdminCreateCollection = ({
  collection,
  className = '',
  children,
  onSuccess
}) => {
  const redirectTo = useRedirect()
  const [, dispatch] = useStateValue()
  const title = useAutoFocus()
  const { collections } = useCollections()
  const [state, setState] = useSetState({ title: get(collection, 'title', '') })
  const { post } = useBackendApi({ authToken: true })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const newCollection = {
    id: kebabCase(state.title),
    title: state.title,
    products: []
  }

  const buttonText = collection ? 'Edit' : 'Add Collection'

  return (
    <ConfirmationModal
      className={children ? className : `btn btn-primary px-4 ${className}`}
      buttonText={children || buttonText}
      confirmText={collection ? 'Edit Collection' : 'Add a Collection'}
      confirmedText={false}
      proceedText={collection ? 'Save' : 'Add'}
      cancelText="Cancel"
      onConfirm={() => {
        const body = collection
          ? { title: state.title }
          : { collections: [...collections, newCollection] }
        return post(`/collections${collection ? `/${collection.id}` : ''}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        })
      }}
      validate={() => {
        const { valid, newState } = validate(state, collections)
        setState(newState)
        return valid
      }}
      onSuccess={() => {
        if (!collection) {
          setState({}, true)
        }
        dispatch({ type: 'reload', target: 'collections' })
        if (onSuccess) {
          onSuccess()
        } else if (!collection) {
          redirectTo(`/admin/collections/${newCollection.id}`, { isNew: true })
          dispatch({ type: 'toast', message: 'Collection created' })
        } else {
          dispatch({ type: 'toast', message: 'Collection updated' })
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
