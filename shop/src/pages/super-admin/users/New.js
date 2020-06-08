import React from 'react'
import { useHistory } from 'react-router-dom'

import useConfig from 'utils/useConfig'
import Link from 'components/Link'

import UserForm from './_Form'

const AdminNewUser = () => {
  const { config } = useConfig()
  const history = useHistory()

  function onSave(user) {
    fetch(`${config.backend}/superuser/users`, {
      credentials: 'include',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(user)
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
  }

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
        <UserForm onSave={onSave} />
      </div>
    </>
  )
}

export default AdminNewUser
