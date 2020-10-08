import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import useProduct from 'utils/useProduct'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import { usePrices } from '../utils'
import BackLink from './_BackLink'

const Redeem = () => {
  const history = useHistory()
  const [quantity, setQuantity] = useState(1)
  const state = usePrices({ quantity })
  const { config } = useConfig()
  const productObj = useProduct(config.singleProduct)
  const [, dispatch] = useStateValue()
  const { product, variant } = productObj
  if (!product) {
    return null
  }

  const ownsNone = Number(state.ownedChico) <= 0

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg p-6 pb-8 text-black mb-6">
        <div className="grid grid-cols-3 mb-4 w-full items-center">
          <BackLink to="/" />
          <div className="font-bold text-xl text-center">Redeem</div>
        </div>
        <img style={{ height: 290 }} src={product.imageUrl} />
        <div className="font-bold text-2xl mt-4">{`You own ${state.ownedChico}`}</div>
        {ownsNone ? null : (
          <>
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
              <ProductOptions {...productObj} />
            </div>
          </>
        )}
      </div>
      <button
        onClick={() => {
          dispatch({ type: 'orderComplete' })
          dispatch({ type: 'addToCart', product, variant })
          history.push('/checkout')
        }}
        className={`btn btn-primary${
          ownsNone ? ' opacity-50 hover:opacity-50' : ''
        }`}
      >
        Redeem
      </button>
    </>
  )
}

const ProductOptions = ({
  variants,
  product,
  options,
  setOption,
  getOptions
}) => {
  const productOptions = get(product, 'options', [])
  if (variants.length <= 1 || !productOptions.length) {
    return null
  }

  return (
    <>
      {productOptions.map((opt, idx) => (
        <React.Fragment key={`${product.id}-${idx}`}>
          <div className="text-xl font-bold">{opt}</div>
          <div className="relative">
            <select
              className="rounded-full w-full border border-black px-4 py-2 font-bold appearance-none"
              style={{ minHeight: '2.5rem' }}
              value={options[`option${idx + 1}`] || ''}
              onChange={(e) => setOption(idx + 1, e.target.value)}
            >
              {getOptions(product, idx).map((item, idx) => (
                <option key={idx}>{item}</option>
              ))}
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
        </React.Fragment>
      ))}
    </>
  )
}

export default Redeem
