import React from 'react'

const EditVariants = ({ options, variants, onChange }) => {
  if (!options || !variants) return null

  return (
    <table className="table admin-products edit-variants">
      <thead>
        <tr>
          {options.map((opt) => (
            <th key={`variant-opt-${opt}`}>{opt}</th>
          ))}
          <th>Image</th>
          <th>Price</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {variants.map((variant, index) => (
          <tr key={variant.name}>
            {variant.options.map((opt) => (
              <td key={`variant-opt-${opt}`}>{opt}</td>
            ))}
            <td>Image</td>
            <td>
              <input
                type="number"
                value={variant.price}
                onChange={(e) => {
                  const updatedVariants = [...variants]
                  updatedVariants[index].price = e.target.value
                  onChange(updatedVariants)
                }}
              />
            </td>
            <td></td>
          </tr>
        ))}
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
      min-width: 150px
      &:nth-child(3)
        width: 150px
      
      &:nth-child(4)
        width: 100%

`)
