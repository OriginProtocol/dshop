import React from 'react'
import { Link } from 'react-router-dom'

import { usePrices } from '../utils'
import useSingleProduct from 'utils/useSingleProduct'
import useConfig from 'utils/useConfig'

import Button from '../components/Button'

const Home = () => {
  const { config } = useConfig()
  const [state] = usePrices({ quantity: 1 })
  const product = useSingleProduct()
  if (!product) {
    return null
  }

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg pt-6 pb-8 text-black mb-6">
        <div className="font-bold text-3xl">{product.title}</div>
        <div className="text-gray-600 text-sm mb-3">{`$${config.coin}`}</div>
        <img style={{ height: 290 }} src={product.imageUrl} />
        <div className="font-bold text-2xl mt-4">{`${state.priceDAIQ} USD`}</div>
        <div className="text-gray-600 text-sm">{`${state.availableChico}/${state.totalChico} available`}</div>
        {state.ownedChico === '0' ? null : (
          <div className="text-sm mt-1 font-bold">{`You own ${state.ownedChico}`}</div>
        )}
      </div>
      <Link to="/buy" className="btn btn-primary">
        Buy
      </Link>
      <div className="w-full grid grid-cols-2 gap-4 mt-6">
        <Button disabled={state.ownedChico === '0'} to="/sell">
          Sell
        </Button>
        <Button disabled={state.ownedChico === '0'} to="/redeem">
          Redeem
        </Button>
      </div>
      <div className="text-gray-400 leading-tight mt-6 text-sm text-center">
        Buy and sell real t-shirts with digital currency. Delivered on demand.
        <Link className="ml-2 text-white hover:opacity-75" to="/about">
          Learn more
        </Link>
      </div>
      <div className="leading-tight mt-6 text-sm">
        <Link to="/order-status" className="text-gray-400 hover:text-white">
          Check order status
        </Link>
      </div>
    </>
  )
}

export default Home
