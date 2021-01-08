import React from 'react'
import get from 'lodash/get'

const ProductOptions = ({
  labelClassName,
  className,
  variants,
  product,
  options,
  setOption,
  getOptions,
  center
}) => {
  const productOptions = get(product, 'options', [])
  if (variants.length <= 1 || !productOptions.length) {
    return null
  }
  const justify = center ? ' justify-center' : ''

  return (
    <div className={`flex mb-8 flex-col sm:flex-row mt-3${justify}`}>
      {productOptions.map((opt, idx) => (
        <div key={`${product.id}-${idx}`} className="font-2xl">
          <div className={labelClassName}>{opt}</div>
          <select
            className={`${className} p-3${idx > 0 ? ' ml-4' : ''}`}
            value={options[`option${idx + 1}`] || ''}
            onChange={(e) => setOption(idx + 1, e.target.value)}
          >
            {getOptions(product, idx).map((item, idx) => (
              <option key={idx}>{item}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

export default ProductOptions
