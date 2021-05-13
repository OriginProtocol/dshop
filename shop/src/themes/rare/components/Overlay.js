import React from 'react'

import Spinner from './LoadingSpinnerC'
import Etherscan from './Etherscan'

const Overlay = ({ loading, hash }) => {
  if (!loading) return null
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-lg z-10"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      <div className="mx-8 p-8 bg-black text-white rounded-lg text-lg font-bold text-center flex flex-col items-center">
        <Spinner className="mb-4" />
        {loading}
        {!hash ? null : (
          <div className="mt-3 font-normal text-sm">
            <Etherscan hash={hash} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Overlay
