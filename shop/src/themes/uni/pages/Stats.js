import React from 'react'

import useConfig from 'utils/useConfig'
import BackLink from '../components/BackLink'
import { usePrices } from '../utils'

const Stats = () => {
  const { config } = useConfig()
  const [state] = usePrices({ quantity: 1 })
  return (
    <div className="w-full flex flex-col bg-white rounded-lg p-6 pb-8 text-black mb-6">
      <div
        className="grid mb-4 w-full items-center"
        style={{ gridTemplateColumns: '1fr auto 1fr' }}
      >
        <BackLink to="/" />
        <div className="font-bold text-xl text-center">{`${config.coin} Stats`}</div>
      </div>
      <div
        className="grid gap-y-1 gap-x-4"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        <div className="font-bold">{`Initial ${config.coin}`}</div>
        <div>{config.initialCoinSupply}</div>
        <div className="font-bold">{`Redeemed ${config.coin}`}</div>
        <div>{config.initialCoinSupply - Number(state.totalChico)}</div>
        <div className="font-bold">{`${config.coin} Pool`}</div>
        <div>{state.availableChico}</div>
      </div>
    </div>
  )
}

export default Stats
