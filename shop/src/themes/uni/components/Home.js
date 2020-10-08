import React from 'react'
import { Link } from 'react-router-dom'

import { usePrices } from '../utils'
import useProduct from 'utils/useProduct'
import useConfig from 'utils/useConfig'

const Home = () => {
  const state = usePrices({ quantity: 1 })
  const { config } = useConfig()
  const { product } = useProduct(config.singleProduct)
  if (!product) {
    return null
  }

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg pt-6 pb-8 text-black mb-6">
        <div className="font-bold text-3xl">{product.title}</div>
        <div className="text-gray-600 text-sm mb-3">$CHICO</div>
        <img style={{ height: 290 }} src={product.imageUrl} />
        <div className="font-bold text-2xl mt-4">{`${state.priceUSD} USD`}</div>
        <div className="text-gray-600 text-sm">{`${state.availableChico}/${state.totalChico} available`}</div>
        {state.ownedChico === '0' ? null : (
          <div className="text-sm mt-1 font-bold">{`You own ${state.ownedChico}`}</div>
        )}
      </div>
      <Link to="/buy" className="btn btn-primary">
        Buy
      </Link>
      <div className="w-full grid grid-cols-2 gap-4 mt-6">
        {state.ownedChico === '0' ? (
          <>
            <div className="btn-disabled">Sell</div>
            <div className="btn-disabled">Redeem</div>
          </>
        ) : (
          <>
            <Link to="/sell" className="btn">
              Sell
            </Link>
            <Link to="/redeem" className="btn">
              Redeem
            </Link>
          </>
        )}
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
