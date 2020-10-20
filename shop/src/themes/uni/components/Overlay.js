import React from 'react'

import Spinner from './LoadingSpinnerC'
import { useWeb3Manager } from '../utils'

const Etherscan = ({ hash }) => {
  const { chainId } = useWeb3Manager()
  if (chainId !== 1 && chainId !== 4) return null

  const isRinkeby = chainId === 4
  const href = `https://${isRinkeby ? 'rinkeby.' : ''}etherscan.io/tx/${hash}`

  return (
    <div className="mt-3 font-normal text-sm">
      <a
        target="_blank"
        rel="noreferrer"
        className="flex items-center hover:underline"
        href={href}
      >
        View on Etherscan
        <img src="images/new-window-icon.svg" className="w-3 ml-2" />
      </a>
    </div>
  )
}

const Overlay = ({ loading, hash }) => {
  if (!loading) return null
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-lg"
      style={{ background: 'rgba(255,255,255,0.8)' }}
    >
      <div className="mx-8 p-8 shadow-lg bg-white rounded-lg border border-gray-300 text-lg font-bold text-center flex flex-col items-center">
        <Spinner className="mb-4" />
        {loading}
        {!hash ? null : <Etherscan hash={hash} />}
      </div>
    </div>
  )
}

export default Overlay
