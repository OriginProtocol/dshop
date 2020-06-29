import React from 'react'
import { useHistory } from 'react-router-dom'

import useBackendApi from 'utils/useBackendApi'
import Link from 'components/Link'

import UserForm from './_Form'

const AdminNewUser = () => {
  const history = useHistory()

  const { post } = useBackendApi({ authToken: true })

  async function onSave(user) {
    const { seller } = await post('/superuser/users', {
      method: 'POST',
      body: JSON.stringify(user)
    })
    if (seller) {
      history.push({
        pathname: `/super-admin/users/${seller.id}`,
        state: { scrollToTop: true }
      })
    }
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
