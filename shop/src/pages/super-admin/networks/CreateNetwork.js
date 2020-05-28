import React from 'react'

import CreateNetworkForm from './CreateNetworkForm'

import Link from 'components/Link'

const ServerSetup = () => {
  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/super-admin/networks" className="muted">
          Networks
        </Link>
        <span className="chevron" />
        New
      </h3>
      <CreateNetworkForm />
    </>
  )
}

export default ServerSetup
