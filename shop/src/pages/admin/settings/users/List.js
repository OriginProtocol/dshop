import React, { useEffect } from 'react'
import _get from 'lodash/get'
import fbt from 'fbt'
import useSetState from 'utils/useSetState'
import useBackendApi from 'utils/useBackendApi'

import { useStateValue } from 'data/state'

import Link from 'components/Link'
import AddUserModal from './_Add'

const AdminUsers = () => {
  const [{ admin }, dispatch] = useStateValue()
  const [state, setState] = useSetState({ loading: false, users: [] })

  const { post, get } = useBackendApi({ authToken: true })

  const loadUsers = async () => {
    const { users } = await get('/shop/users')
    setState({
      loading: false,
      users: users,
      name: undefined,
      email: undefined,
      password: undefined
    })
  }

  const resendCode = async () => {
    try {
      await post('/resend-email', {
        method: 'PUT'
      })

      dispatch({
        type: 'toast',
        message: fbt(
          'Email has been resent, check your inbox',
          'admin.settings.users.resendSuccess'
        )
      })
    } catch (err) {
      console.error(err)
      dispatch({
        type: 'toast',
        style: 'error',
        message: fbt(
          'Failed to send email, check your email configuration settings',
          'admin.settings.users.resendError'
        )
      })
    }
  }

  useEffect(() => {
    setState({ loading: true })
    loadUsers()
  }, [])

  return (
    <>
      <h3 className="admin-title">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        Users
        <div className="actions">
          <AddUserModal afterSave={() => loadUsers()} />
        </div>
      </h3>
      {state.loading ? (
        <>
          <fbt desc="Loading">Loading</fbt>...
        </>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>
                <fbt desc="User">User</fbt>
              </th>
              <th>
                <fbt desc="Email">Email</fbt>
              </th>
              <th>
                <fbt desc="Role">Role</fbt>
              </th>
              <th>
                <fbt desc="EmailVerified">Email Verified</fbt>
              </th>
            </tr>
          </thead>
          <tbody>
            {state.users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.emailVerified ? (
                    '✅'
                  ) : (
                    <>
                      {_get(admin, 'email') === user.email ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            resendCode()
                          }}
                        >
                          <fbt desc="admin.settings.users.resendCode">
                            Resend code
                          </fbt>
                        </a>
                      ) : (
                        '❌'
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default AdminUsers
