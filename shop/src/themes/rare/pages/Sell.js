import React, { useState, useReducer, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import ethers from 'ethers'

import Link from 'components/Link'

import { usePrices, useContracts, useWeb3Manager } from '../utils'
import useSingleProduct from 'utils/useSingleProduct'
import useConfig from 'utils/useConfig'

import SelectQuantity from '../components/SelectQuantity'
import SelectToken from '../components/SelectToken'
import ButtonPrimary from '../components/ButtonPrimary'
import Overlay from '../components/Overlay'
import OrderSummary from '../components/OrderSummary'

const initialState = {
  text: 'Sell',
  disabled: false,
  loading: false,
  error: ''
}
const reducer = (state, newState = {}) => ({ ...initialState, ...newState })

const Sell = () => {
  const { config } = useConfig()
  const history = useHistory()
  const [button, setButton] = useReducer(reducer, initialState)
  const { account, library, activate, desiredNetwork } = useWeb3Manager()
  const { router, chico, weth } = useContracts()
  const [reload, setReload] = useState(1)
  const [state, setState] = usePrices({ reload })

  useEffect(() => {
    if (!account) {
      setButton({ text: `Connect a Web3 Wallet`, onClickOverride: activate })
    } else if (desiredNetwork) {
      setButton({ disabled: `Connect wallet to ${desiredNetwork}` })
    } else if (state.ethBalance.lt(ethers.utils.parseEther('0.00001'))) {
      setButton({ disabled: 'Not Enough ETH to Pay Gas' })
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

  async function onClick() {
    if (ownsNone) {
      return
    }

    const signer = library.getSigner()
    const chicoBN = ethers.utils.parseEther(String(state.quantitySell))

    const approved = await chico.allowance(account, router.address)
    if (approved.lt(chicoBN)) {
      try {
        setButton({ loading: `Approve ${config.coin}...` })
        const approveTx = await chico
          .connect(signer)
          .approve(router.address, chicoBN)
        const { hash } = approveTx
        setButton({ loading: 'Awaiting transaction...', hash })
        await approveTx.wait()
      } catch (e) {
        setButton({ error: e.message.toString() })
        return
      }
    }

    try {
      setButton({ loading: 'Approve sale...' })
      const path = [chico.address, weth.address]
      const deadline = Math.round(new Date() / 1000) + 60 * 60 * 24

      if (state.token !== 'ETH') {
        path.push(state.tokenContract.address)
      }
      let swapTx
      if (state.token === 'ETH') {
        swapTx = await router
          .connect(signer)
          .swapExactTokensForETH(
            chicoBN,
            state.getUSDQO,
            path,
            account,
            deadline
          )
      } else {
        swapTx = await router
          .connect(signer)
          .swapExactTokensForTokens(
            chicoBN,
            state.getUSDQO,
            path,
            account,
            deadline
          )
      }
      const { hash } = swapTx
      setButton({ loading: 'Awaiting transaction...', hash })
      await swapTx.wait()
      setReload(reload + 1)
      history.push(`/sell/confirmation?tx=${button.hash}`)
    } catch (e) {
      setButton({ error: e.message.toString() })
    }
  }

  return (
    <>
      <div className="container mt-12">
        <div className="text-3xl sm:text-5xl font-semibold">
          Sell <span className="text-purple-600">$CHICO</span>
        </div>
      </div>
      <div className="container flex flex-col sm:flex-row mt-8 gap-6 items-stretch sm:items-start">
        <div style={{ flex: 6 }}>
          <div className="text-lg font-medium">
            How many $CHICO would you like to sell?
          </div>
          <div className="bg-gray-900 rounded-lg flex items-center justify-center py-8 mt-4">
            <SelectQuantity
              {...{
                quantity: state.quantitySell,
                setQuantity: (quantitySell) => setState({ quantitySell }),
                max: numOwned
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-baseline mt-12">
            <div className="text-lg font-medium">Receive token</div>
            <div className="text-sm">
              All transactions are secure and encrypted
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg flex flex-col items-center justify-center py-8 mt-4 relative">
            <SelectToken {...{ state, setState, field: 'getUSDQ' }} />
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
              <ButtonPrimary {...button} onClick={onClick} />
            </div>
          </div>
        </div>
        <div className="sm:ml-6" style={{ flex: 4 }}>
          <OrderSummary
            state={state}
            quantity={state.quantitySell}
            field="getDAIQ"
          />
        </div>
      </div>
    </>
  )
}

export default Sell
