import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import dayjs from 'dayjs'

import useConfig from 'utils/useConfig'
import useSetState from 'utils/useSetState'

import Link from 'components/Link'

const AdminUsers = () => {
  const { config } = useConfig()
  const history = useHistory()
  const [state, setState] = useSetState({ users: [] })

  useEffect(() => {
    fetch(`${config.backend}/superuser/users`, { credentials: 'include' })
      .then((res) => res.json())
      .then(setState)
  }, [])

  return (
    <>
      <h3 className="admin-title">
        Users
        <div className="actions">
          <Link to="/super-admin/users/new" className="btn btn-primary">
            Add user
          </Link>
        </div>
      </h3>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Created</th>
            <th className="text-center">Admin</th>
          </tr>
        </thead>
        <tbody>
          {state.users.map((user) => (
            <tr
              key={user.id}
              onClick={() => {
                history.push(`/super-admin/users/${user.id}`)
              }}
            >
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{dayjs(user.createdAt).format('MMM D, h:mm A')}</td>
              <td className="text-center">{user.superuser ? '✅' : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default AdminUsers
