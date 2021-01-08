import React from 'react'

import { StateProvider } from 'data/state'
import ConfigLoader from './ConfigLoader'

const DshopProvider = ({ children }) => {
  return (
    <StateProvider>
      <ConfigLoader>{children}</ConfigLoader>
    </StateProvider>
  )
}

export default DshopProvider
