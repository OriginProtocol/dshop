import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useWeb3React } from '@web3-react/core'
import ethers from 'ethers'

import BackLink from './_BackLink'
import { usePrices, dai, router, chico } from '../utils'

const Buy = () => {
  const history = useHistory()
  const { account, library } = useWeb3React()
  const [quantity, setQuantity] = useState(1)
  const [reload, setReload] = useState(1)
  const [buttonText, setButtonText] = useState('Place Order')
  const state = usePrices({ quantity, reload })

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg p-6 pb-8 text-black mb-6">
        <div className="grid grid-cols-3 mb-4 w-full items-center">
          <BackLink to="/" />
          <div className="font-bold text-xl text-center">Buy</div>
        </div>
        <img
          style={{ height: 290 }}
          src="chico-crypto/t-shirt/orig/upload_2f7c0a222af290fb052fdd9140364ed3"
        />
        <div className="font-bold text-2xl mt-4">{`${state.priceUSD} USD`}</div>
        <div className="text-gray-600 text-sm">{`${state.availableChico}/${state.totalChico} available`}</div>
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
              <option>{`${state.priceUSDQ} DAI`}</option>
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
                  Math.ceil((Number(state.priceUSDQ) / quantity) * 100) / 100
                } DAI per item`}
              </div>
            </>
          )}
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={async () => {
          const signer = library.getSigner()
          const approved = await dai
            .connect(signer)
            .allowance(account, router.address)

          if (approved.lt(state.priceUSDBN)) {
            try {
              setButtonText('Approve DAI...')
              const approveTx = await dai
                .connect(signer)
                .approve(router.address, state.priceUSDA)
              setButtonText('Awaiting transaction...')
              await approveTx.wait()
            } catch (e) {
              setButtonText('Place Order')
              return
            }
          }

          try {
            setButtonText('Approve purchase...')
            const swapTx = await router
              .connect(signer)
              .swapTokensForExactTokens(
                ethers.utils.parseEther(String(quantity)),
                ethers.utils.parseEther('1000'),
                [dai.address, chico.address],
                account,
                Math.round(new Date() / 1000) + 60 * 60 * 24
              )
            setButtonText('Awaiting transaction...')
            await swapTx.wait()
          } catch (e) {
            setButtonText('Place Order')
            return
          }
          setReload(reload + 1)
          history.push('/')
        }}
      >
        {buttonText}
      </button>
    </>
  )
}

export default Buy
