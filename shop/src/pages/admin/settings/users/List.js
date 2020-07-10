import React, { useEffect } from 'react'
import _get from 'lodash/get'

import useSetState from 'utils/useSetState'
import useBackendApi from 'utils/useBackendApi'

import { useStateValue } from 'data/state'

import Tabs from '../_Tabs'
import AddUserModal from './_Add'

const AdminUsers = () => {
  const [{ admin }] = useStateValue()
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
    await post('/resend-email', {
      method: 'PUT'
    })
  }

  useEffect(() => {
    setState({ loading: true })
    loadUsers()
  }, [])

  return (
    <>
      <h3 className="admin-title">
        Settings
        <div className="actions">
          <AddUserModal afterSave={() => loadUsers()} />
        </div>
      </h3>
      <Tabs />
      {state.loading ? (
        'Loading...'
      ) : (
        <table className="table mt-4">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Email Verified</th>
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
                          Resend code
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
