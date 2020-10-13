import React from 'react'
import BackLink from '../components/BackLink'

const Stats = () => {
  return (
    <div className="w-full flex flex-col bg-white rounded-lg p-6 pb-8 text-black mb-6">
      <div
        className="grid mb-4 w-full items-center"
        style={{ gridTemplateColumns: '1fr auto 1fr' }}
      >
        <BackLink to="/" />
        <div className="font-bold text-xl text-center">CHICO Stats</div>
      </div>
      <div
        className="grid gap-y-1 gap-x-4"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        <div className="font-bold">Initial CHICO</div>
        <div>50</div>
        <div className="font-bold">Redeemed CHICO</div>
        <div>10</div>
        <div className="font-bold">CHICO Pool</div>
        <div>25</div>
      </div>
    </div>
  )
}

export default Stats
