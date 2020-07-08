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

const reducer = (state, newState) => ({ ...state, ...newState })

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
    setState({
      ...newState,
      saving: !!valid
    })
    if (!valid) return

    try {
      await post('/shop/add-user', {
        method: 'POST',
        body: JSON.stringify(
          pick(newState, ['name', 'email', 'password', 'role'])
        )
      })
      setState({ saving: false, shouldClose: true })
      if (afterSave) afterSave()
    } catch (err) {
      console.error(err)
      setState({
        saving: false
      })
    }
  }

  return (
    <>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => setState({ showModal: true })}
      >
        Add User
      </button>
      {!state.showModal ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            setState({ showModal: false, shouldClose: false })
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createUser()
            }}
          >
            <div className="modal-body payment-method-modal">
              <h5>Add User</h5>

              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Name"
                  {...input('name')}
                />
                {Feedback('name')}
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Email"
                  {...input('email')}
                />
                {Feedback('email')}
              </div>
              <div className="form-group">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  {...input('password')}
                />
                {Feedback('password')}
              </div>
              <div className="form-group">
                <select className="form-control" {...input('role')}>
                  <option>Role...</option>
                  <option>Admin</option>
                  <option>Basic </option>
                </select>
              </div>

              <div className="actions">
                <button
                  className="btn btn-outline-primary mr-2"
                  type="button"
                  onClick={() => setState({ shouldClose: true })}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={createUser}
                  disabled={state.saving}
                >
                  {state.saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export default AddUserModal

require('react-styl')(`
  .payment-method-modal
    h5
      margin-top: 1rem
      text-align: center
    .actions
      border-top: 1px solid #cdd7e0
      padding-top: 1.25rem
      margin-top: 1.5rem
      display: flex
      justify-content: center

      .btn
        width: 135px
`)
