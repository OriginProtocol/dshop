import React, { useEffect, useState, useReducer } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import { ethers } from 'ethers'
import useBackendApi from 'utils/useBackendApi'
import addData from 'data/addData'
import useConfig from 'utils/useConfig'
import usePGP from 'utils/usePGP'
import { useStateValue } from 'data/state'
import useForm from 'utils/useForm'
import { Countries, CountriesDefaultInfo } from '@origin/utils/Countries'
import validate from 'data/validations/checkoutInfo'

import CountrySelect from 'components/CountrySelect'
import ProvinceSelect from 'components/ProvinceSelect'

import { usePrices, useContracts, useWeb3Manager } from '../utils'
import Title from '../components/Title'
import ButtonPrimary from '../components/ButtonPrimary'
import Overlay from '../components/Overlay'

const initialButtonState = {
  text: 'Redeem',
  disabled: false,
  loading: false,
  error: ''
}
const reducer = (state, newState = {}) => ({
  ...initialButtonState,
  ...newState
})

const Checkout = () => {
  usePGP()
  const { chico } = useContracts()
  const [button, setButton] = useReducer(reducer, initialButtonState)
  const { account, library, activate, desiredNetwork } = useWeb3Manager()
  const [{ cart }, dispatch] = useStateValue()
  const { state, setState, input, Feedback } = useForm(initialState(cart))
  const { config } = useConfig()
  const history = useHistory()
  const [reload, setReload] = useState(1)
  const { post } = useBackendApi({ authToken: true })
  const [priceState] = usePrices({ reload, quantity: 1 })

  const country = Countries[state.country] || 'United States'
  const item = get(cart, 'items.0')

  useEffect(() => {
    if (!account) {
      setButton({ text: `Connect a Web3 Wallet`, onClickOverride: activate })
    } else if (desiredNetwork) {
      setButton({ disabled: `Connect wallet to ${desiredNetwork}` })
    } else if (priceState.ethBalance.lt(ethers.utils.parseEther('0.00001'))) {
      setButton({ disabled: 'Not Enough ETH to Pay Gas' })
    } else {
      setButton()
    }
  }, [desiredNetwork, priceState, account])

  useEffect(() => {
    if (!item) {
      history.push('/redeem')
    }
  }, [item])

  if (!item) {
    return null
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const { valid, newState } = validate(state)
        setState(newState)
        if (!valid) {
          return
        }
        dispatch({ type: 'updateUserInfo', info: newState })

        const encryptedData = await addData(
          {
            ...cart,
            userInfo: newState,
            shipping: { id: 'free', label: 'Free Shipping', amount: 0 },
            paymentMethod: { id: 'crypto', label: 'Crypto Currency' }
          },
          config
        )

        const codeResponse = await post('/crypto/payment-code', {
          body: JSON.stringify({
            fromAddress: account,
            toAddress: ethers.constants.AddressZero,
            amount: cart.total,
            currency: config.currency
          })
        })

        try {
          const signer = library.getSigner()
          setButton({ loading: 'Approve redemption...' })
          const tx = await chico
            .connect(signer)
            .burn(ethers.utils.parseEther('1'))

          const { hash } = tx
          setButton({ loading: 'Awaiting transaction...', hash })
          await tx.wait()
          setReload(reload + 1)

          await post('/crypto/payment', {
            body: JSON.stringify({
              txHash: tx.hash,
              fromAddress: account,
              toAddress: ethers.constants.AddressZero,
              encryptedDataIpfsHash: encryptedData.hash,
              paymentCode: codeResponse.paymentCode
            })
          })
          history.push('/redeem/confirmation')
        } catch (e) {
          setButton({ error: e.message.toString() })
        }
      }}
    >
      <div className="w-full grid grid-cols-1 gap-2 bg-white rounded-lg p-6 pb-8 text-black mb-6 relative">
        <Title back="/redeem">
          <div className="flex-1 flex flex-row justify-center text-lg font-bold">
            <div className="text-gray-600">{'Redeem / '}</div>
            <div className="ml-2">Shipping Details</div>
          </div>
        </Title>
        <div className="flex">
          <img style={{ height: 150 }} src={item.imageUrl} />
          <div className="ml-6 mt-6 leading-tight">
            <div className="text-3xl font-bold">{`${item.quantity} ${item.title}`}</div>
            <div className="text-3xl text-gray-400">
              {item.options.join(', ')}
            </div>
          </div>
        </div>
        <div className="font-bold w-full text-left mt-4 text-lg mb-4">
          Where should we send it?
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input {...input('firstName')} placeholder="First Name" autoFocus />
            <Feedback error={state.firstNameError} />
          </div>
          <div>
            <input {...input('lastName')} placeholder="Last Name" />
            <Feedback error={state.lastNameError} />
          </div>
        </div>
        <div>
          <input {...input('email')} placeholder="Email" />
          <Feedback error={state.emailError} />
        </div>
        <div>
          <input {...input('address1')} placeholder="Street Address 1" />
          <Feedback error={state.address1Error} />
        </div>
        <div>
          <input {...input('address2')} placeholder="Street Address 2" />
          <Feedback error={state.address2Error} />
        </div>
        <div>
          <input {...input('city')} placeholder="City" />
          <Feedback error={state.cityError} />
        </div>
        <div>
          <CountrySelect
            className="w-full border border-gray-300 bg-gray-100 px-2 py-1 rounded"
            value={state.country}
            onChange={(e) => {
              const provinces = get(Countries[e.target.value], 'provinces')
              setState({
                country: e.target.value,
                province: provinces ? Object.keys(provinces)[0] : ''
              })
            }}
          />
        </div>
        <div
          className={`grid grid-cols-${!country.provinces ? '1' : '2'} gap-2`}
        >
          {!country.provinces ? null : (
            <div>
              <ProvinceSelect
                className="border px-3 py-2 bg-gray-100 w-full"
                country={country}
                {...input('province')}
              />
              <Feedback error={state.provinceError} />
            </div>
          )}
          <div>
            <input
              {...input('zip')}
              placeholder={get(
                country,
                'labels.zip',
                CountriesDefaultInfo.labels.zip
              )}
            />
            <Feedback error={state.zipError} />
          </div>
        </div>

        {!button.disabled ? null : (
          <div className="text-lg mt-6 font-bold text-red-600">
            {button.disabled}
          </div>
        )}
        <Overlay {...button} />
      </div>
      <ButtonPrimary {...button} />
    </form>
  )
}

function initialState(cart) {
  return {
    initialState: cart.userInfo || { country: 'United States' },
    className: 'w-full border bg-gray-100 px-2 py-1 rounded',
    defaultClassName: 'border-gray-300',
    errorClassName: 'border-red-600',
    feedbackClassName: 'mt-1 text-sm text-red-600'
  }
}

export default Checkout
