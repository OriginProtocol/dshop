import React from 'react'
import { Link } from 'react-router-dom'

import { usePrices } from '../utils'

const Home = () => {
  const state = usePrices({ quantity: 1 })

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg pt-6 pb-8 text-black mb-6">
        <div className="font-bold text-3xl">Chico Tee Limited Edition</div>
        <div className="text-gray-600 text-sm mb-3">$CHICO</div>
        <img
          style={{ height: 290 }}
          src="chico-crypto/t-shirt/orig/upload_2f7c0a222af290fb052fdd9140364ed3"
        />
        <div className="font-bold text-2xl mt-4">{`${state.priceUSD} USD`}</div>
        <div className="text-gray-600 text-sm">{`${state.availableChico}/${state.totalChico} available`}</div>
      </div>
      <Link to="/buy" className="btn btn-primary">
        Buy
      </Link>
      <div className="w-full grid grid-cols-2 gap-4 mt-6">
        <Link to="/sell" className="btn">
          Sell
        </Link>
        <Link to="/redeem" className="btn">
          Redeem
        </Link>
      </div>
      <div className="text-gray-400 leading-tight mt-6 text-sm text-center">
        Buy and sell real t-shirts with digital currency. Delivered on demand.{' '}
        <Link className="text-white hover:opacity-75" to="/info">
          Learn more
        </Link>
      </div>
      <Link
        to="/order-status"
        className="text-gray-400 leading-tight mt-6 text-sm hover:text-white"
      >
        Check order status
      </Link>
    </>
  )
}

export default Home
