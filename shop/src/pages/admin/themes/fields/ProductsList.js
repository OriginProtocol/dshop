import React from 'react'

import useProducts from 'utils/useProducts'

const ProductsList = ({ field, value, onChange }) => {
  const { products } = useProducts()

  const selection = value || []

  const updateList = (productId, checked) => {
    if (checked && !selection.includes(productId)) {
      onChange([...selection, productId])
    } else if (!checked) {
      onChange(selection.filter((pId) => pId !== productId))
    }
  }

  return (
    <div className="form-group">
      <label>{field.title}</label>
      <div className="theme-selectable-list form-group">
        {products.map((product) => (
          <div className="form-check" key={product.id}>
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={selection.includes(product.id)}
                onChange={(e) => updateList(product.id, e.target.checked)}
              />
              {product.title}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductsList

require('react-styl')(`
  .theme-selectable-list
    padding: 5px
    border: 1px solid #cdd7e0
    max-height: 200px
    overflow: scroll
    label
      font-weight: normal
`)
