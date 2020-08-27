import React from 'react'

import fbt from 'fbt'

import formatPrice from 'utils/formatPrice'
import SelectVariantImage from './_SelectVariantImage'

const EditVariants = ({
  options,
  variants,
  media,
  onChange,
  disabled,
  currency
}) => {
  if (!options || !variants) return null

  return (
    <table className="table admin-products edit-variants">
      <thead>
        <tr>
          <th>
            <fbt desc="Available">Available</fbt>
          </th>
          {options.map((opt, idx) => (
            <th key={`variant-opt-${opt || idx}`}>{opt}</th>
          ))}
          <th>
            <fbt desc="Price">Price</fbt>
          </th>
          <th>
            <fbt desc="SKU">SKU</fbt>
          </th>
          <th>
            <fbt desc="Image">Image</fbt>
          </th>
        </tr>
      </thead>
      <tbody>
        {variants.map((variant, index) => {
          const variantImage =
            media.find((m) => m.path === variant.image) || media[0]
          return (
            <tr key={variant.name}>
              <td>
                <div className="form-check m-0">
                  <input
                    type="checkbox"
                    checked={variant.available || false}
                    disabled={disabled}
                    onChange={(e) => {
                      const updatedVariants = [...variants]
                      updatedVariants[index].available = e.target.checked
                      onChange(updatedVariants)
                    }}
                  />
                </div>
              </td>
              {variant.options.map((opt) => (
                <td key={`variant-opt-${opt}`}>{opt}</td>
              ))}
              <td>
                <div className="form-group m-0">
                  <div className="input-group" style={{ maxWidth: 150 }}>
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        {formatPrice(0, { symbolOnly: true, currency })}
                      </span>
                    </div>
                    <input
                      value={variant.price}
                      className="form-control"
                      disabled={!variant.available || disabled}
                      onChange={(e) => {
                        const updatedVariants = [...variants]
                        updatedVariants[index].price = e.target.value
                        updatedVariants[index].priceError = undefined
                        onChange(updatedVariants)
                      }}
                    />
                    {!variant.priceError ? null : (
                      <div className="invalid-feedback d-block">
                        {variant.priceError}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <div className="form-group m-0">
                  <input
                    value={variant.sku}
                    className="form-control"
                    disabled={!variant.available || disabled}
                    onChange={(e) => {
                      const updatedVariants = [...variants]
                      updatedVariants[index].sku = e.target.value
                      onChange(updatedVariants)
                    }}
                  />
                </div>
              </td>
              <td>
                <SelectVariantImage
                  selection={variantImage}
                  media={media}
                  onChange={(selectedMedia) => {
                    const updatedVariants = [...variants]
                    updatedVariants[index].image = selectedMedia.path
                    onChange(updatedVariants)
                  }}
                  disabled={disabled}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default EditVariants

require('react-styl')(`
  .edit-variants
    margin: 2rem 0
    th, td
      white-space: nowrap
      max-width: 150px
`)
