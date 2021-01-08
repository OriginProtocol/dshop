import React, { useState, useEffect, useReducer } from 'react'
import { useHistory } from 'react-router-dom'
import { ethers } from 'ethers'

import Title from '../components/Title'
import { usePrices, useContracts, useWeb3Manager } from '../utils'
import useSingleProduct from 'utils/useSingleProduct'

import SelectToken from '../components/SelectToken'
import SelectQuantity from '../components/SelectQuantity'
import ButtonPrimary from '../components/ButtonPrimary'
import Overlay from '../components/Overlay'

const initialState = {
  text: 'Place Order',
  disabled: false,
  loading: false,
  error: '',
  onClick: null
}
const reducer = (state, newState = {}) => ({ ...initialState, ...newState })

const Buy = () => {
  const [button, setButton] = useReducer(reducer, initialState)
  const history = useHistory()
  const { router, chico, weth } = useContracts()
  const { account, library, desiredNetwork, activate } = useWeb3Manager()
  const [reload, setReload] = useState(1)
  const [state, setState] = usePrices({ reload })

  useEffect(() => {
    if (!account) {
      setButton({ text: `Connect a Web3 Wallet`, onClickOverride: activate })
    } else if (desiredNetwork) {
      setButton({ disabled: `Connect wallet to ${desiredNetwork}` })
    } else if (state.ethBalance.lt(ethers.utils.parseEther('0.00001'))) {
      setButton({ disabled: 'Not Enough ETH to Pay Gas' })
    } else if (state.tokenBalance.lt(state.priceUSDBN)) {
      setButton({ disabled: `Not Enough ${state.token} Balance` })
    } else {
      setButton()
    }
  }, [desiredNetwork, state, account])

  const product = useSingleProduct()
  if (!product) {
    return null
  }

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg p-6 pb-8 text-black mb-6 relative">
        <Title back="/">Buy</Title>
        <img style={{ height: 290 }} src={product.imageUrl} />
        <div className="font-bold text-2xl mt-4 flex items-baseline">
          {`${state.priceDAIAvg} USD`}
          <div className="text-gray-600 ml-1 text-lg font-normal">/each</div>
        </div>
        <div className="text-gray-600 text-sm flex">
          {`${state.availableChico}/${state.totalChico} available`}
          {state.ownedChico === '0' ? null : (
            <div className="ml-4">{`You own ${state.ownedChico}`}</div>
          )}
        </div>
        <div className="grid grid-cols-2 w-full mt-6 items-center gap-y-4">
          <div className="text-xl font-bold">Quantity</div>
          <SelectQuantity
            {...{
              quantity: state.quantityBuy,
              setQuantity: (quantityBuy) => setState({ quantityBuy })
            }}
          />
          <div className="text-xl font-bold">Payment method</div>
          <SelectToken {...{ state, setState }} />
        </div>
        {!button.disabled ? null : (
          <div className="text-lg mt-6 font-bold text-red-600">
            {button.disabled}
          </div>
        )}
        <Overlay {...button} />
      </div>
      <ButtonPrimary
        {...button}
        onClick={async () => {
          const signer = library.getSigner()
          if (state.token !== 'ETH') {
            const approved = await state.tokenContract
              .connect(signer)
              .allowance(account, router.address)

            if (approved.lt(state.priceUSDQO)) {
              try {
                setButton({ loading: `Approve ${state.token}...` })
                const approveTx = await state.tokenContract
                  .connect(signer)
                  .approve(router.address, state.priceUSDQO)
                const { hash } = approveTx
                setButton({ loading: `Awaiting transaction...`, hash })
                await approveTx.wait()
              } catch (e) {
                setButton({ error: e.message.toString() })
                return
              }
            }
          }

          try {
            setButton({ loading: `Approve purchase...` })
            let swapTx
            if (state.token === 'ETH') {
              swapTx = await router
                .connect(signer)
                .swapETHForExactTokens(
                  ethers.utils.parseEther(String(state.quantityBuy)),
                  [weth.address, chico.address],
                  account,
                  Math.round(new Date() / 1000) + 60 * 60 * 24,
                  { value: state.priceUSDQO, gasLimit: '2000000' }
                )
            } else {
              swapTx = await router
                .connect(signer)
                .swapTokensForExactTokens(
                  ethers.utils.parseEther(String(state.quantityBuy)),
                  state.priceUSDQO,
                  [state.tokenContract.address, weth.address, chico.address],
                  account,
                  Math.round(new Date() / 1000) + 60 * 60 * 24
                )
            }
            const { hash } = swapTx
            setButton({ loading: `Awaiting transaction...`, hash })
            await swapTx.wait()
          } catch (e) {
            setButton({ error: e.message.toString() })
            return
          }
          setReload(reload + 1)
          history.push('/buy/confirmation')
        }}
      />
    </>
  )
}

export default Buy
