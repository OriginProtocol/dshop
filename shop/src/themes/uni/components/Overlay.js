import React from 'react'

import Spinner from './LoadingSpinnerC'

const Overlay = ({ children }) => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-lg"
      style={{ background: 'rgba(255,255,255,0.8)' }}
    >
      <div className="mx-8 p-8 shadow-lg bg-white rounded-lg border border-gray-300 text-lg font-bold text-center flex flex-col items-center">
        <Spinner className="mb-4" />
        {children}
      </div>
    </div>
  )
}

export default Overlay
