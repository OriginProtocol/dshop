import React, { useEffect } from 'react'

import fbt from 'fbt'
import get from 'lodash/get'

import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import SelectVariantImage from './_SelectVariantImage'

const EditVariants = ({
  options,
  variants,
  media,
  onChange,
  disabled,
  currency
}) => {
  const { config } = useConfig()
  useEffect(() => {
    if (!media || !variants) return

    const mediaPaths = media.map((m) => m.path)

    let hasChange = false

    const newVariants = [...variants]

    for (let idx = 0; idx < variants.length; idx++) {
      const variant = variants[idx]

      if (mediaPaths.includes(variant.image)) {
        continue
      }

      // Variant image has been removed
      // Make the first product image as variant image

      if (!media.length && !variant.image) {
        // It's already reset, ignore
        continue
      }

      hasChange = true

      newVariants[idx] = {
        ...variant,
        image: get(media, '0.path')
      }
    }

    if (hasChange) {
      onChange(newVariants)
    }
  }, [media, variants])

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
          {!config.inventory ? null : (
            <th>
              <fbt desc="AvailableStock">Available Stock</fbt>
            </th>
          )}
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
              {!config.inventory ? null : (
                <td>
                  <div className="form-group m-0">
                    <input
                      value={variant.quantity}
                      className="form-control"
                      type="number"
                      min="0"
                      step="1"
                      disabled={!variant.available || disabled}
                      onChange={(e) => {
                        const updatedVariants = [...variants]
                        updatedVariants[index].quantity = e.target.value
                        onChange(updatedVariants)
                      }}
                    />
                  </div>
                </td>
              )}
              <td>
                <SelectVariantImage
                  selection={variantImage}
                  media={media}
                  onChange={(selectedMedia) => {
                    const updatedVariants = [...variants]
                    updatedVariants[index].image = selectedMedia.path
                    onChange(updatedVariants)
                  }}
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
