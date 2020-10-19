import React, { useState, useReducer, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import ethers from 'ethers'

import BackLink from '../components/BackLink'
import { usePrices, useContracts, useWeb3Manager } from '../utils'
import useSingleProduct from 'utils/useSingleProduct'
import useConfig from 'utils/useConfig'

import SelectQuantity from '../components/SelectQuantity'
import SelectToken from '../components/SelectToken'
import ButtonPrimary from '../components/ButtonPrimary'
import Overlay from '../components/Overlay'

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

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg p-6 pb-8 text-black mb-6 relative">
        <div className="grid grid-cols-3 mb-4 w-full items-center">
          <BackLink to="/" />
          <div className="font-bold text-xl text-center">Sell</div>
        </div>
        <img style={{ height: 290 }} src={product.imageUrl} />
        <div className="font-bold text-2xl mt-4 flex items-baseline">
          {`${state.getDAIQAvg} USD`}
          <div className="text-gray-600 ml-1 text-lg font-normal">/each</div>
        </div>
        <div className="text-gray-600 text-sm flex">
          {`You own ${state.ownedChico}`}
        </div>
        {ownsNone ? null : (
          <div className="grid grid-cols-2 w-full mt-6 items-center gap-y-4">
            {numOwned <= 1 ? null : (
              <>
                <div className="text-xl font-bold">Quantity</div>
                <SelectQuantity
                  {...{
                    quantity: state.quantitySell,
                    setQuantity: (quantitySell) => setState({ quantitySell }),
                    max: numOwned
                  }}
                />
              </>
            )}
            <div className="text-xl font-bold">Token to receive</div>
            <SelectToken {...{ state, setState }} field="getUSDQ" />
          </div>
        )}
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
            history.push('/sell/confirmation')
          } catch (e) {
            setButton({ error: e.message.toString() })
          }
        }}
      />
    </>
  )
}

export default Sell
