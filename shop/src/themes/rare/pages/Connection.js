import React from 'react'

import { useWeb3Manager } from '../utils'

const Connection = () => {
  const { account, chainId, isNetwork } = useWeb3Manager()
  return (
    <div className="container max-w-md mx-auto mt-12">
      <div
        className="grid gap-y-1 gap-x-4"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        <div className="font-bold">Network</div>
        <div>{chainId}</div>
        <div className="font-bold">Connection</div>
        <div>{isNetwork ? 'Default' : 'Injected'}</div>
        <div className="font-bold">Account</div>
        <div className="truncate">{account}</div>
      </div>
    </div>
  )
}

export default Connection
