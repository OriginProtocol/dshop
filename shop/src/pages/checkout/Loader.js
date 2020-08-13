import React, { Suspense } from 'react'
import fbt from 'fbt'
const Checkout = React.lazy(() => import('./Checkout'))

const Loader = () => (
  <Suspense
    fallback={
      <div className="loading-fullpage">
        <fbt desc="Loading">Loading</fbt>
      </div>
    }
  >
    <Checkout />
  </Suspense>
)

export default Loader

require('react-styl')(`
  .loading-fullpage
    min-height: 100vh
    display: flex
    align-items: center
    justify-content: center
`)
