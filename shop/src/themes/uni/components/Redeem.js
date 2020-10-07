import React from 'react'
import { Link } from 'react-router-dom'

const Buy = () => {
  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg p-6 pb-8 text-black mb-6">
        <div className="grid grid-cols-3 mb-4 w-full items-center">
          <Link to="/" className="hover:opacity-75">
            <svg width="16" height="16">
              <g stroke="#000" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="1" x2="1" y2="8" />
                <line x1="1" y1="8" x2="8" y2="15" />
                <line x1="2" y1="8" x2="15" y2="8" />
              </g>
            </svg>
          </Link>
          <div className="font-bold text-xl text-center">Buy</div>
        </div>
        <img
          style={{ height: 290 }}
          src="chico-crypto/t-shirt/orig/upload_2f7c0a222af290fb052fdd9140364ed3"
        />
        <div className="font-bold text-2xl mt-4">546.90 USD</div>
        <div className="text-gray-600 text-sm">29/123 available</div>
        <div className="grid grid-cols-2 w-full mt-6 items-center gap-y-4">
          <div className="text-xl font-bold">Quantity</div>
          <div
            className="rounded-full border border-black grid grid-cols-3 items-center font-bold m-height-12"
            style={{ minHeight: '2.5rem' }}
          >
            <div className="text-xl px-4">-</div>
            <div className="text-center">1</div>
            <div className="text-xl text-right px-4">+</div>
          </div>
          <div className="text-xl font-bold">Payment method</div>
          <div className="relative">
            <select
              className="rounded-full w-full border border-black px-4 py-2 font-bold appearance-none"
              style={{ minHeight: '2.5rem' }}
            >
              <option>1.6283 ETH</option>
            </select>
            <svg
              width="14"
              height="9"
              fill="none"
              className="absolute"
              style={{ top: 'calc(50% - 4px)', right: '1rem' }}
            >
              <path d="M1 1L7 7L13 1" stroke="black" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
      <Link
        to="/buy"
        className="btn border-0 hover:text-white hover:opacity-75"
        style={{
          backgroundImage:
            'linear-gradient(to right, #53ff96, #4b9dff 55%, #f644ff)'
        }}
      >
        Next
      </Link>
    </>
  )
}

export default Buy
