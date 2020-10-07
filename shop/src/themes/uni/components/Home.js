import React from 'react'

import Link from 'components/Link'

const Home = () => {
  return (
    <div
      className="container mt-16 flex flex-col items-center justify-center"
      style={{ width: 480 }}
    >
      <div className="w-full flex flex-col items-center bg-white rounded-lg pt-6 pb-8 text-black mb-6">
        <div className="font-bold text-3xl">Chico Tee Limited Edition</div>
        <div className="text-gray-600 text-sm mb-3">$CHICO</div>
        <img
          style={{ height: 290 }}
          src="chico-crypto/t-shirt/orig/upload_2f7c0a222af290fb052fdd9140364ed3"
        />
        <div className="font-bold text-2xl mt-4">546.90 USD</div>
        <div className="text-gray-600 text-sm">29/123 available</div>
      </div>
      <div
        className="w-full text-center text-white font-bold py-3 text-lg"
        style={{
          borderRadius: '50px',
          backgroundImage:
            'linear-gradient(to right, #53ff96, #4b9dff 55%, #f644ff)'
        }}
      >
        Buy
      </div>
      <div className="w-full grid grid-cols-2 gap-4 mt-6">
        <div
          className="w-full text-center text-white font-bold py-3 text-lg border border-white"
          style={{ borderRadius: '50px' }}
        >
          Sell
        </div>
        <div
          className="w-full text-center text-white font-bold py-3 text-lg border border-white"
          style={{ borderRadius: '50px' }}
        >
          Redeem
        </div>
      </div>
      <div className="text-gray-400 leading-tight mt-6 text-sm text-center">
        Buy and sell real t-shirts with digital currency. Delivered on demand.{' '}
        <a className="text-white">Learn more</a>
      </div>
      <div className="text-gray-400 leading-tight mt-6 text-sm hover:text-white">
        Check order status
      </div>
    </div>
  )
}

export default Home
