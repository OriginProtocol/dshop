import React, { useEffect } from 'react'
import { useRouteMatch } from 'react-router-dom'
import dayjs from 'dayjs'

import useConfig from 'utils/useConfig'
import useSetState from 'utils/useSetState'

import Link from 'components/Link'
import DeleteUser from './_Delete'

const AdminUser = () => {
  const { config } = useConfig()
  const match = useRouteMatch('/super-admin/users/:userId')
  const { userId } = match.params
  const [state, setState] = useSetState({ user: {}, loading: true })

  useEffect(() => {
    const url = `${config.backend}/superuser/users/${userId}`
    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then(({ user, shops }) => setState({ user, shops, loading: false }))
  }, [])

  const { loading, user, shops } = state

  if (loading) {
    return 'Loading...'
  }

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/super-admin/users" className="muted">
          Users
        </Link>
        <span className="chevron" />
        {user.name}
        <div className="actions">
          <Link
            to={`/super-admin/users/${userId}/edit`}
            className="btn btn-outline-primary"
            children="Edit"
          />
          <DeleteUser userId={userId} />
        </div>
      </h3>
      <div className="d-flex">
        <div className="grid-table">
          <div>Name</div>
          <div>{user.name}</div>
          <div>Email</div>
          <div>{user.email}</div>
          <div>Created</div>
          <div>{dayjs(user.createdAt).format('MMM D, h:mm A')}</div>
          {!user.superuser ? null : (
            <>
              <div>Admin</div>
              <div>✅</div>
            </>
          )}
        </div>
      </div>
      <table className="table table-sm mt-4 w-auto" style={{ minWidth: 200 }}>
        <thead>
          <tr>
            <th>Shop</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((sellerShop) => (
            <tr key={sellerShop.shop.authToken}>
              <td>{sellerShop.shop.name}</td>
              <td>{sellerShop.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default AdminUser

require('react-styl')(`
  .grid-table
    display: grid
    grid-template-columns: auto auto
    row-gap: 0.5rem
    column-gap: 1rem
    > div:nth-child(odd)
      font-weight: bold
`)
