import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import useProduct from 'utils/useProduct'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import { usePrices } from '../utils'
import Title from '../components/Title'
import Select from '../components/Select'
import SelectQuantity from '../components/SelectQuantity'

const Redeem = () => {
  const history = useHistory()
  const [quantity, setQuantity] = useState(1)
  const [state] = usePrices({ quantity })
  const { config } = useConfig()
  const productObj = useProduct(config.singleProduct)
  const [, dispatch] = useStateValue()
  const { product, variant } = productObj
  if (!product) {
    return null
  }

  const numOwned = Number(state.ownedChico) || 0
  const ownsNone = numOwned <= 0

  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg p-6 pb-8 text-black mb-6">
        <Title back="/">Redeem</Title>
        <img style={{ height: 290 }} src={product.imageUrl} />
        <div className="font-bold text-2xl mt-4">{`You own ${state.ownedChico}`}</div>
        {ownsNone ? null : (
          <>
            <div className="grid grid-cols-2 w-full mt-6 items-center gap-y-4">
              {numOwned <= 1 ? null : (
                <>
                  <div className="text-xl font-bold">Quantity</div>
                  <SelectQuantity
                    {...{ quantity, setQuantity, max: numOwned }}
                  />
                </>
              )}

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
        Next
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

  return productOptions.map((opt, idx) => (
    <React.Fragment key={`${product.id}-${idx}`}>
      <div className="text-xl font-bold">{opt}</div>
      <Select>
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
      </Select>
    </React.Fragment>
  ))
}

export default Redeem
