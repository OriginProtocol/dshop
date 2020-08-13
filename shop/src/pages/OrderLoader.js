import React, { Suspense } from 'react'
import fbt from 'fbt'

const Order = React.lazy(() => import('./Order'))

const OrderLoader = () => (
  <Suspense
    fallback={
      <div className="loading-fullpage">
        <fbt desc="Loading">Loading</fbt>
      </div>
    }
  >
    <Order />
  </Suspense>
)

export default OrderLoader
