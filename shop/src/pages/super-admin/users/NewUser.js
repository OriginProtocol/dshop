import React from 'react'
import { useHistory } from 'react-router-dom'

import { formInput, formFeedback } from 'utils/formHelpers'
import useConfig from 'utils/useConfig'
import useSetState from 'utils/useSetState'
import Link from 'components/Link'

function validate(state) {
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

  if (!state.password) {
    newState.passwordError = 'Enter a password'
  } else if (state.password.length < 3) {
    newState.passwordError = 'Password is too short'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const AdminNewUser = () => {
  const { config } = useConfig()
  const history = useHistory()
  const [state, setState] = useSetState()

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/super-admin/users" className="muted">
          Users
        </Link>
        <span className="chevron" />
        New User
      </h3>
      <div className="row">
        <form
          className="col-md-6"
          onSubmit={(e) => {
            e.preventDefault()
            const { valid, newState } = validate(state)
            setState(newState)
            if (valid) {
              fetch(`${config.backend}/superuser/users`, {
                credentials: 'include',
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(newState)
              })
                .then((res) => res.json())
                .then(({ seller }) => {
                  if (seller) {
                    history.push({
                      pathname: `/super-admin/users/${seller.id}`,
                      state: { scrollToTop: true }
                    })
                  }
                })
            } else {
              window.scrollTo(0, 0)
            }
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
            <label>Password</label>
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
          </div>
        </form>
      </div>
    </>
  )
}

export default AdminNewUser
