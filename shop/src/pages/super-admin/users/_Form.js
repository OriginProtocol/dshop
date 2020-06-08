import React, { useEffect } from 'react'

import { formInput, formFeedback } from 'utils/formHelpers'
import useSetState from 'utils/useSetState'
import formData from 'data/formData'

function validate(state, user) {
  const newState = {}

  if (!state.name) {
    newState.nameError = 'Enter a name'
  } else if (state.name.length < 3) {
    newState.nameError = 'Name is too short'
  }

  if (!state.email) {
    newState.emailError = 'Enter an email'
  } else if (state.email.length < 3) {
    newState.emailError = 'Email is too short'
  }

  if (!user) {
    if (!state.password) {
      newState.passwordError = 'Enter a password'
    } else if (state.password.length < 3) {
      newState.passwordError = 'Password is too short'
    }
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const AdminUserForm = ({ onSave, user, onCancel, errors }) => {
  const [state, setState] = useSetState(user)

  useEffect(() => {
    setState(user)
  }, [user])

  useEffect(() => {
    if (errors) {
      setState(errors)
    }
  }, [errors])

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <form
      className="col-md-6"
      onSubmit={(e) => {
        e.preventDefault()
        const { valid, newState } = validate(state, user)
        setState(newState)
        if (!valid) {
          window.scrollTo(0, 0)
          return
        }
        onSave(formData(newState))
      }}
    >
      <div className="form-group">
        <label>Name</label>
        <input {...input('name')} />
        {Feedback('name')}
      </div>
      <div className="form-group">
        <label>Email</label>
        <input {...input('email')} />
        {Feedback('email')}
      </div>
      <div className="form-group">
        <label>{user ? 'New Password' : 'Password'}</label>
        <input type="password" {...input('password')} />
        {Feedback('password')}
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            className="mr-2"
            checked={state.superuser ? true : false}
            onChange={(e) => setState({ superuser: e.target.checked })}
          />
          Super admin
        </label>
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {!onCancel ? null : (
          <button
            type="button"
            className="btn btn-outline-secondary ml-2"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default AdminUserForm
