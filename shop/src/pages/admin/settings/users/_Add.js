import React, { useReducer } from 'react'
import fbt from 'fbt'
import pick from 'lodash/pick'

import { formInput, formFeedback } from 'utils/formHelpers'
import useBackendApi from 'utils/useBackendApi'

import Modal from 'components/Modal'

function validate(state) {
  const newState = {}

  if (!state.name) {
    newState.nameError = fbt('Enter a name', 'admin.settings.users.nameError')
  }
  if (!state.email) {
    newState.emailError = fbt(
      'Enter an email',
      'admin.settings.users.emailError'
    )
  }
  if (!state.password) {
    newState.passwordError = fbt(
      'Enter a password',
      'admin.settings.users.passwordError'
    )
  }
  if (!state.role) {
    newState.roleError = fbt('Select a role', 'admin.settings.users.roleError')
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
        <h5>
          <fbt desc="admin.settings.users.addUser">Add User</fbt>
        </h5>
        <div className="form-group">
          <input placeholder={fbt('Name', 'Name')} {...input('name')} />
          {Feedback('name')}
        </div>
        <div className="form-group">
          <input placeholder={fbt('Email', 'Email')} {...input('email')} />
          {Feedback('email')}
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder={fbt('Password', 'Password')}
            {...input('password')}
          />
          {Feedback('password')}
        </div>
        <div className="form-group">
          <select {...input('role')}>
            <option value="">
              <fbt desc="Role">Role</fbt>...
            </option>
            <option>
              <fbt desc="Admin">Admin</fbt>
            </option>
            <option>
              <fbt desc="Basic">Basic</fbt>
            </option>
          </select>
          {Feedback('role')}
        </div>

        <div className="actions">
          <button
            className="btn btn-outline-primary mr-2"
            type="button"
            onClick={() => setState({ shouldClose: true })}
            children={<fbt desc="Cancel">Cancel</fbt>}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={createUser}
            disabled={state.saving}
            children={
              state.saving ? (
                <>
                  <fbt desc="Saving">Saving</fbt>...
                </>
              ) : (
                <fbt desc="Save">Save</fbt>
              )
            }
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
        children={<fbt desc="admin.settings.users.addUser">Add User</fbt>}
      />
      {!state.showModal ? null : (
        <Modal shouldClose={state.shouldClose} onClose={() => setState(false)}>
          {state.sellerExists ? (
            <>
              <div className="modal-body payment-method-modal">
                <h5>
                  <fbt desc="admin.settings.users.userAdded">User Added</fbt>
                </h5>
                <div className="description my-3">
                  <fbt desc="admin.settings.users.existingSellerInfo">
                    The email address you specified was already registered, so
                    the user was given permission to access this shop.
                  </fbt>
                </div>
                <div className="actions">
                  <button
                    className="btn btn-outline-primary mr-2"
                    type="button"
                    onClick={() => setState({ shouldClose: true })}
                    children={<fbt desc="OK">OK</fbt>}
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
