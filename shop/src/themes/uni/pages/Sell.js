import React, { useState, useReducer, useEffect } from 'react'
import ethers from 'ethers'

import BackLink from '../components/BackLink'
import { usePrices, useContracts, useWeb3Manager } from '../utils'
import useSingleProduct from 'utils/useSingleProduct'

import SelectQuantity from '../components/SelectQuantity'
import SelectToken from '../components/SelectToken'
import ButtonPrimary from '../components/ButtonPrimary'

const initialState = {
  text: 'Sell',
  disabled: false,
  loading: false,
  error: ''
}
const reducer = (state, newState = {}) => ({ ...initialState, ...newState })

const Sell = () => {
  const [button, setButton] = useReducer(reducer, initialState)
  const { account, library, activate, desiredNetwork } = useWeb3Manager()
  const { router, chico, weth } = useContracts()
  const [quantity, setQuantity] = useState(1)
  const [reload, setReload] = useState(1)
  const [state, setState] = usePrices({ quantity, reload })

  useEffect(() => {
    if (!account) {
      setButton({ text: `Connect a Web3 Wallet`, onClickOverride: activate })
    } else if (desiredNetwork) {
      setButton({ text: `Connect wallet to ${desiredNetwork}`, disabled: true })
    } else if (state.ethBalance.lt(ethers.utils.parseEther('0.00001'))) {
      setButton({ text: 'Not Enough ETH to Pay Gas', disabled: true })
    } else {
      setButton()
    }
  }, [desiredNetwork, state, account])

  const product = useSingleProduct()
  if (!product) {
    return null
  }

  const numOwned = Number(state.ownedChico) || 0
  const ownsNone = numOwned <= 0

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg p-6 pb-8 text-black mb-6">
        <div className="grid grid-cols-3 mb-4 w-full items-center">
          <BackLink to="/" />
          <div className="font-bold text-xl text-center">Sell</div>
        </div>
        <img style={{ height: 290 }} src={product.imageUrl} />
        <div className="font-bold text-2xl mt-4">{`You own ${state.ownedChico}`}</div>
        {ownsNone ? null : (
          <div className="grid grid-cols-2 w-full mt-6 items-center gap-y-4">
            {numOwned <= 1 ? null : (
              <>
                <div className="text-xl font-bold">Quantity</div>
                <SelectQuantity {...{ quantity, setQuantity, max: numOwned }} />
              </>
            )}

            <div className="text-xl font-bold">Token to receive</div>
            <SelectToken {...{ state, setState }} />
            {quantity <= 1 ? null : (
              <>
                <div />
                <div
                  className="text-gray-600 text-sm"
                  style={{ marginTop: -10, paddingLeft: 18 }}
                >
                  {`${
                    Math.ceil((Number(state.getDAIQ) / quantity) * 100) / 100
                  } USD per item`}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ButtonPrimary
        {...button}
        onClick={async () => {
          if (ownsNone) {
            return
          }

          const signer = library.getSigner()

          try {
            setButton({ text: 'Approve CHICO...', loading: true })
            const approveTx = await chico
              .connect(signer)
              .approve(
                router.address,
                ethers.utils.parseEther(String(quantity))
              )
            setButton({ text: 'Awaiting transaction...', loading: true })
            await approveTx.wait()
          } catch (e) {
            setButton({ error: e.message.toString() })
            return
          }

          try {
            setButton({ text: 'Approve sale...', loading: true })
            const path = [chico.address, weth.address]
            if (state.token !== 'ETH') {
              path.push(state.tokenContract.address)
            }
            let swapTx
            if (state.token === 'ETH') {
              swapTx = await router
                .connect(signer)
                .swapExactTokensForETH(
                  ethers.utils.parseEther(String(quantity)),
                  '0',
                  path,
                  account,
                  Math.round(new Date() / 1000) + 60 * 60 * 24
                )
            } else {
              swapTx = await router
                .connect(signer)
                .swapExactTokensForTokens(
                  ethers.utils.parseEther(String(quantity)),
                  ethers.utils.parseEther(String(quantity)),
                  path,
                  account,
                  Math.round(new Date() / 1000) + 60 * 60 * 24
                )
            }
            setButton({ text: 'Awaiting transaction...', loading: true })
            await swapTx.wait()
            setReload(reload + 1)
          } catch (e) {
            setButton({ error: e.message.toString() })
            return
          }
        }}
      />
    </>
  )
}

export default Sell
