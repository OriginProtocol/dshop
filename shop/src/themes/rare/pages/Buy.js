import React, { useState, useEffect, useReducer } from 'react'
import { useHistory } from 'react-router-dom'
import ethers from 'ethers'

import { usePrices, useContracts, useWeb3Manager } from '../utils'
import useSingleProduct from 'utils/useSingleProduct'

import Link from 'components/Link'

import ButtonPrimary from '../components/ButtonPrimary'
import Overlay from '../components/Overlay'
import SelectToken from '../components/SelectToken'
import SelectQuantity from '../components/SelectQuantity'
import OrderSummary from '../components/OrderSummary'

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

  async function onPurchase() {
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
  }

  return (
    <>
      <div className="container mt-12">
        <div className="text-3xl sm:text-5xl font-semibold">
          Buy <span className="text-purple-600">$CHICO</span>
        </div>
      </div>
      <div className="container flex flex-col sm:flex-row mt-8 gap-6 items-stretch sm:items-start">
        <div style={{ flex: 6 }}>
          <div className="sm:text-lg font-medium">
            How many $CHICO would you like to buy?
          </div>
          <div className="bg-gray-900 rounded-lg flex items-center justify-center py-8 mt-4">
            <SelectQuantity
              {...{
                quantity: state.quantityBuy,
                setQuantity: (quantityBuy) => setState({ quantityBuy })
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-baseline mt-12">
            <div className="text-lg font-medium">Payment method</div>
            <div className="text-sm">
              All transactions are secure and encrypted
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg flex flex-col items-center justify-center py-8 mt-4 relative">
            <SelectToken {...{ state, setState }} />
            {!button.disabled ? null : (
              <div className="text-lg mt-4 font-bold text-red-600">
                {button.disabled}
              </div>
            )}
            <Overlay {...button} />
          </div>
          <div className="flex flex-col-reverse items-stretch sm:grid grid-cols-2 sm:gap-8 mt-8 items-start">
            <Link to="/product" className="btn">
              Cancel
            </Link>
            <div className="mb-4 sm:mb-0">
              <ButtonPrimary {...button} onClick={onPurchase} />
            </div>
          </div>
        </div>
        <div className="sm:ml-6" style={{ flex: 4 }}>
          <OrderSummary state={state} quantity={state.quantityBuy} />
        </div>
      </div>
    </>
  )
}

export default Buy
