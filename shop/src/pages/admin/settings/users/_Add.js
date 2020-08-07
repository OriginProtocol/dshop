import React, { useReducer } from 'react'

import pick from 'lodash/pick'

import { formInput, formFeedback } from 'utils/formHelpers'
import useBackendApi from 'utils/useBackendApi'

import Modal from 'components/Modal'

function validate(state) {
  const newState = {}

  if (!state.name) {
    newState.nameError = 'Enter a name'
  }
  if (!state.email) {
    newState.emailError = 'Enter an email'
  }
  if (!state.password) {
    newState.passwordError = 'Enter a password'
  }
  if (!state.role) {
    newState.roleError = 'Select a role'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const reducer = (state, newState) => {
  if (newState === false) return {}
  return { ...state, ...newState }
}

const AddUserModal = ({ afterSave }) => {
  const [state, setState] = useReducer(reducer, {
    showModal: false,
    shouldClose: false
  })

  const { post } = useBackendApi({ authToken: true })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const createUser = async () => {
    const { valid, newState } = validate(state)
    setState({ ...newState, saving: !!valid })
    if (!valid) return

    const userData = pick(newState, ['name', 'email', 'password', 'role'])
    post('/shop/add-user', {
      suppressError: true,
      method: 'POST',
      body: JSON.stringify(userData)
    })
      .then(({ success, message, sellerExists }) => {
        if (success && sellerExists) {
          setState({ saving: false, sellerExists: true })
        } else if (success) {
          setState({ saving: false, shouldClose: true })
          if (afterSave) afterSave()
        } else {
          setState({ saving: false, emailError: message })
        }
      })
      .catch((err) => {
        console.error(err)
        setState({ saving: false })
      })
  }

  const form = (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        createUser()
      }}
    >
      <div className="modal-body payment-method-modal">
        <h5>Add User</h5>
        <div className="form-group">
          <input placeholder="Name" {...input('name')} />
          {Feedback('name')}
        </div>
        <div className="form-group">
          <input placeholder="Email" {...input('email')} />
          {Feedback('email')}
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            {...input('password')}
          />
          {Feedback('password')}
        </div>
        <div className="form-group">
          <select {...input('role')}>
            <option value="">Role...</option>
            <option>Admin</option>
            <option>Basic</option>
          </select>
          {Feedback('role')}
        </div>

        <div className="actions">
          <button
            className="btn btn-outline-primary mr-2"
            type="button"
            onClick={() => setState({ shouldClose: true })}
            children="Cancel"
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={createUser}
            disabled={state.saving}
            children={state.saving ? 'Saving...' : 'Save'}
          />
        </div>
      </div>
    </form>
  )

  return (
    <>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => setState({ showModal: true })}
        children="Add User"
      />
      {!state.showModal ? null : (
        <Modal shouldClose={state.shouldClose} onClose={() => setState(false)}>
          {state.sellerExists ? (
            <>
              <div className="modal-body payment-method-modal">
                <h5>User Added</h5>
                <div className="description my-3">
                  The email address you specified was already registered, so the
                  user was given permission to access this shop.
                </div>
                <div className="actions">
                  <button
                    className="btn btn-outline-primary mr-2"
                    type="button"
                    onClick={() => setState({ shouldClose: true })}
                    children="OK"
                  />
                </div>
              </div>
            </>
          ) : (
            form
          )}
        </Modal>
      )}
    </>
  )
}

export default AddUserModal

require('react-styl')(`
`)
