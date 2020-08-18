import React from 'react'
import kebabCase from 'lodash/kebabCase'
import get from 'lodash/get'

import fbt from 'fbt'

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
    newState.titleError = fbt(
      'Enter a name',
      'admin.collections.new.titleError'
    )
  } else if (state.title.length < 3) {
    newState.titleError = fbt(
      'Name is too short',
      'admin.collections.new.titleLenError'
    )
  }

  if (
    collections.find((c) => c.title.toLowerCase() === state.title.toLowerCase())
  ) {
    newState.titleError = fbt(
      'Collection with that name already exists',
      'admin.collections.new.titleDupError'
    )
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

  const buttonText = collection
    ? fbt('Edit', 'Edit')
    : fbt('Add Collection', 'admin.collections.new.addCollection')

  return (
    <ConfirmationModal
      className={children ? className : `btn btn-primary px-5 ${className}`}
      buttonText={children || buttonText}
      confirmText={
        collection
          ? fbt('Edit Collection', 'admin.collections.new.editCollection')
          : fbt('Add a Collection', 'admin.collections.new.addACollection')
      }
      confirmedText={false}
      proceedText={collection ? fbt('Save', 'Save') : fbt('Add', 'Add')}
      cancelText={fbt('Cancel', 'Cancel')}
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
          dispatch({
            type: 'toast',
            message: fbt(
              'Collection created',
              'admin.collections.new.createSuccess'
            )
          })
        } else {
          dispatch({
            type: 'toast',
            message: fbt(
              'Collection updated',
              'admin.collections.new.updateSuccess'
            )
          })
        }
      }}
    >
      <div className="form-row mt-3">
        <label>
          <fbt desc="admin.collections.new.name">Collection name</fbt>
        </label>
        <input
          ref={title}
          {...input('title')}
          autoFocus
          placeholder="e.g. Apparel"
        />
        {Feedback('title')}
      </div>
    </ConfirmationModal>
  )
}

export default AdminCreateCollection
