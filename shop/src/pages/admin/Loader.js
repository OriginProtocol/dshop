import React, { Suspense } from 'react'
import fbt from 'fbt'

const Admin = React.lazy(() => import('./Admin'))

const AdminLoader = () => (
  <Suspense
    fallback={
      <div className="loading-fullpage">
        <fbt desc="Loading">Loading</fbt>...
      </div>
    }
  >
    <Admin />
  </Suspense>
)

export default AdminLoader
