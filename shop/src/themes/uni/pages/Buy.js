import React, { useState, useEffect, useReducer } from 'react'
import { useHistory } from 'react-router-dom'
import ethers from 'ethers'

import Title from '../components/Title'
import { usePrices, useContracts, useWeb3Manager } from '../utils'
import useSingleProduct from 'utils/useSingleProduct'

import SelectToken from '../components/SelectToken'
import SelectQuantity from '../components/SelectQuantity'
import ButtonPrimary from '../components/ButtonPrimary'

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
    } else if (state.tokenBalance.lt(state.priceUSDBN)) {
      setButton({ text: `Not Enough ${state.token} Balance`, disabled: true })
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
      <div className="w-full flex flex-col items-center bg-white rounded-lg p-6 pb-8 text-black mb-6">
        <Title back="/">Buy</Title>
        <img style={{ height: 290 }} src={product.imageUrl} />
        <div className="font-bold text-2xl mt-4">{`${state.priceDAI} USD`}</div>
        <div className="text-gray-600 text-sm">{`${state.availableChico}/${state.totalChico} available`}</div>
        <div className="grid grid-cols-2 w-full mt-6 items-center gap-y-4">
          <div className="text-xl font-bold">Quantity</div>
          <SelectQuantity {...{ quantity, setQuantity }} />

          <div className="text-xl font-bold">Payment method</div>
          <SelectToken {...{ state, setState }} />
          {quantity <= 1 ? null : (
            <>
              <div />
              <div
                className="text-gray-600 text-sm"
                style={{ marginTop: -10, paddingLeft: 18 }}
              >
                {`${
                  Math.ceil((Number(state.priceDAIQ) / quantity) * 10000) /
                  10000
                } USD per item`}
              </div>
            </>
          )}
        </div>
      </div>
      <ButtonPrimary
        {...button}
        onClick={async () => {
          const signer = library.getSigner()
          if (state.token !== 'ETH') {
            const approved = await state.tokenContract
              .connect(signer)
              .allowance(account, router.address)

            if (approved.lt(state.priceUSDBN)) {
              try {
                setButton({ text: `Approve ${state.token}...`, loading: true })
                const approveTx = await state.tokenContract
                  .connect(signer)
                  .approve(router.address, state.priceUSDA)
                setButton({ text: `Awaiting transaction...`, loading: true })
                await approveTx.wait()
              } catch (e) {
                setButton({ error: e.message.toString() })
                return
              }
            }
          }

          try {
            setButton({ text: `Approve purchase...`, loading: true })
            let swapTx
            if (state.token === 'ETH') {
              swapTx = await router
                .connect(signer)
                .swapETHForExactTokens(
                  ethers.utils.parseEther(String(quantity)),
                  [weth.address, chico.address],
                  account,
                  Math.round(new Date() / 1000) + 60 * 60 * 24,
                  { value: state.priceUSDA, gasLimit: '2000000' }
                )
            } else {
              swapTx = await router
                .connect(signer)
                .swapTokensForExactTokens(
                  ethers.utils.parseEther(String(quantity)),
                  ethers.utils.parseEther('1000'),
                  [state.tokenContract.address, weth.address, chico.address],
                  account,
                  Math.round(new Date() / 1000) + 60 * 60 * 24
                )
            }
            setButton({ text: `Awaiting transaction...`, loading: true })
            await swapTx.wait()
          } catch (e) {
            setButton({ error: e.message.toString() })
            return
          }
          setReload(reload + 1)
          history.push('/')
        }}
      />
    </>
  )
}

export default Buy
