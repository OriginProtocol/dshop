import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import Link from 'components/Link'

import useProduct from 'utils/useProduct'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import { usePrices } from '../utils'
import RedeemSummary from '../components/RedeemSummary'
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
      <div className="container mt-12">
        <div className="text-3xl sm:text-5xl font-semibold">
          Redeem <span className="text-purple-600">$CHICO</span>
        </div>
      </div>
      <div className="container flex flex-col sm:flex-row mt-8 gap-6 items-stretch sm:items-start">
        <div style={{ flex: 6 }}>
          <div className="text-lg font-medium">
            How many $CHICO would you like to redeem?
          </div>
          <div className="bg-gray-900 rounded-lg flex items-center justify-center py-8 mt-4">
            <SelectQuantity {...{ quantity, setQuantity, max: numOwned }} />
          </div>
          <ProductOptions {...productObj} />

          <div className="grid grid-cols-2 gap-8 mt-8 items-start">
            <Link to="/product" className="btn">
              Cancel
            </Link>
            <div>
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
            </div>
          </div>
        </div>
        <div className="sm:ml-6" style={{ flex: 4 }}>
          <RedeemSummary
            item={{
              imageUrl: product.imageUrl,
              quantity,
              options: Object.values(productObj.options)
            }}
          />
        </div>
      </div>
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

  return productOptions.map((opt, idx) => {
    const currentVal = options[`option${idx + 1}`] || ''

    return (
      <React.Fragment key={`${product.id}-${idx}`}>
        <div className="mt-12 text-lg font-medium">{opt}</div>
        <div className="bg-gray-900 rounded-lg flex items-center justify-center py-8 mt-4 relative">
          <div className="grid grid-flow-col gap-8 text-4xl">
            {getOptions(product, idx).map((item, itemIdx) => (
              <div
                className={
                  currentVal === item
                    ? 'border-b-2 border-white'
                    : 'text-gray-300 hover:text-white cursor-pointer'
                }
                onClick={() => setOption(idx + 1, item)}
                key={itemIdx}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </React.Fragment>
    )
  })

  // <Select>
  //       <select
  //         className="rounded-full w-full border border-black px-4 py-2 font-bold appearance-none"
  //         style={{ minHeight: '2.5rem' }}
  //         value={options[`option${idx + 1}`] || ''}
  //         onChange={(e) => setOption(idx + 1, e.target.value)}
  //       >
  //         {getOptions(product, idx).map((item, idx) => (
  //           <option key={idx}>{item}</option>
  //         ))}
  //       </select>
  //     </Select>
}

export default Redeem
