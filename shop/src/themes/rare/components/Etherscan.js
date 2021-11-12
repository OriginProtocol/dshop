import React from 'react'

import { useWeb3Manager } from '../utils'

const Icon = ({ className }) => (
  <svg className={className} viewBox="0 0 22 22">
    <g fillRule="evenodd" fill="#8293A4">
      <path
        d="M1389.012 40l4.036 4-6.978 7.069 2.829 2.829 6.976-7.071L1400 51V40h-10.988zM1378 43v19h19V52h-1.999v8H1380V44.999h8V43h-10z"
        transform="translate(-1378 -40)"
      />
    </g>
  </svg>
)

const Etherscan = ({ hash }) => {
  const { chainId } = useWeb3Manager()
  if (chainId !== 1 && chainId !== 4) return null

  const isRinkeby = chainId === 4
  const href = `https://${isRinkeby ? 'rinkeby.' : ''}etherscan.io/tx/${hash}`

  return (
    <a
      target="_blank"
      rel="noreferrer"
      className="flex items-center hover:underline"
      href={href}
    >
      View on Etherscan
      <Icon className="w-3 ml-2" />
    </a>
  )
}

export default Etherscan
