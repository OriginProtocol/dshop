import React, { useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { Link } from 'react-router-dom'
import ethers from 'ethers'

import { usePrices, dai, router, chico } from '../utils'

const Sell = () => {
  const { account, library } = useWeb3React()
  const [quantity, setQuantity] = useState(1)
  const [reload, setReload] = useState(1)
  const state = usePrices({ quantity, reload })

  const ownsNone = Number(state.ownedChico) <= 0

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
          <div className="font-bold text-xl text-center">Sell</div>
        </div>
        <img
          style={{ height: 290 }}
          src="chico-crypto/t-shirt/orig/upload_2f7c0a222af290fb052fdd9140364ed3"
        />
        <div className="font-bold text-2xl mt-4">{`You own ${state.ownedChico}`}</div>
        {ownsNone ? null : (
          <div className="grid grid-cols-2 w-full mt-6 items-center gap-y-4">
            <div className="text-xl font-bold">Quantity</div>
            <div
              className="rounded-full border border-black grid grid-cols-3 items-center font-bold m-height-12"
              style={{ minHeight: '2.5rem' }}
            >
              <a
                href="#"
                className="text-xl px-4 hover:opacity-50"
                onClick={(e) => {
                  e.preventDefault()
                  if (quantity > 1) {
                    setQuantity(quantity - 1)
                  }
                }}
              >
                -
              </a>
              <div className="text-center">{quantity}</div>
              <a
                href="#"
                className="text-xl text-right px-4 hover:opacity-50"
                onClick={(e) => {
                  e.preventDefault()
                  if (quantity < 50) {
                    setQuantity(quantity + 1)
                  }
                }}
              >
                +
              </a>
            </div>
            <div className="text-xl font-bold">Payment method</div>
            <div className="relative">
              <select
                className="rounded-full w-full border border-black px-4 py-2 font-bold appearance-none"
                style={{ minHeight: '2.5rem' }}
              >
                <option>{`${state.getUSDQ} DAI`}</option>
                <option>OUSD</option>
                <option>OGN</option>
                <option>DAI</option>
                <option>USDT</option>
                <option>USDC</option>
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
            {quantity <= 1 ? null : (
              <>
                <div />
                <div
                  className="text-gray-600 text-sm"
                  style={{ marginTop: -10, paddingLeft: 18 }}
                >
                  {`${
                    Math.ceil((Number(state.getUSDQ) / quantity) * 100) / 100
                  } DAI per item`}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <button
        className={`btn btn-primary${
          ownsNone ? ' opacity-50 hover:opacity-50' : ''
        }`}
        onClick={() => {
          if (ownsNone) {
            return
          }
          const signer = library.getSigner()
          chico
            .connect(signer)
            .approve(router.address, ethers.utils.parseEther(String(quantity)))
            .then(() =>
              router
                .connect(signer)
                .swapExactTokensForTokens(
                  ethers.utils.parseEther(String(quantity)),
                  ethers.utils.parseEther(String(quantity)),
                  [chico.address, dai.address],
                  account,
                  Math.round(new Date() / 1000) + 60 * 60 * 24
                )
            )
            .then((r) => r.wait())
            .then(() => setReload(reload + 1))
        }}
      >
        Sell
      </button>
    </>
  )
}

export default Sell
