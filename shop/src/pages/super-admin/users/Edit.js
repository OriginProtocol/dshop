import React, { useEffect, useState } from 'react'
import { useRouteMatch } from 'react-router-dom'
import omit from 'lodash/omit'

import useRedirect from 'utils/useRedirect'
import useConfig from 'utils/useConfig'
import Link from 'components/Link'

import UserForm from './_Form'

const AdminNewUser = () => {
  const { config } = useConfig()
  const redirectTo = useRedirect()
  const match = useRouteMatch('/super-admin/users/:userId')
  const { userId } = match.params
  const [user, setUser] = useState()
  const [errors, setErrors] = useState()

  useEffect(() => {
    const url = `${config.backend}/superuser/users/${userId}`
    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then(({ user }) => setUser(omit(user, 'password')))
  }, [])

  function onSave(user) {
    fetch(`${config.backend}/superuser/users/${userId}`, {
      credentials: 'include',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(user)
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          redirectTo(`/super-admin/users/${userId}`)
        } else if (res.field) {
          setErrors({ [`${res.field}Error`]: res.reason })
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
        Edit User
      </h3>
      <div className="row">
        <UserForm
          onSave={onSave}
          user={user}
          errors={errors}
          onCancel={() => redirectTo(`/super-admin/users/${userId}`)}
        />
      </div>
    </>
  )
}

export default AdminNewUser
