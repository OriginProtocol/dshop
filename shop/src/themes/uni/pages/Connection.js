import React from 'react'
import Title from '../components/Title'

import { useWeb3Manager } from '../utils'

const Connection = () => {
  const { account, chainId, isNetwork } = useWeb3Manager()
  return (
    <div className="w-full flex flex-col bg-white rounded-lg p-6 pb-8 text-black mb-6">
      <Title back="/">Connection</Title>
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
