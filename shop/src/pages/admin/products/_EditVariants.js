import React from 'react'

import SelectVariantImage from './_SelectVariantImage'

const EditVariants = ({ options, variants, media, onChange }) => {
  if (!options || !variants) return null

  return (
    <table className="table admin-products edit-variants">
      <thead>
        <tr>
          <th>Available</th>
          {options.map((opt) => (
            <th key={`variant-opt-${opt}`}>{opt}</th>
          ))}
          <th>Price</th>
          <th>Image</th>
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
                  <input
                    type="number"
                    value={variant.price}
                    className="form-control"
                    disabled={!variant.available}
                    onChange={(e) => {
                      const updatedVariants = [...variants]
                      updatedVariants[index].price = e.target.value
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
