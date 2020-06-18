import flatMap from 'lodash/flatMap'

export const getAllCombinations = (array1, ...arrays) => {
  const combinationsOf2Array = (a, b) => a
    .reduce((combinations, v1) => [...combinations, ...b.map(v2 => flatMap([v1, v2]))], [])

  if (arrays.length === 1) {
    return combinationsOf2Array(array1, arrays[0])
  } else if (arrays.length >= 2) {
    return getAllCombinations(
      array1, 
      getAllCombinations(arrays[0], ...arrays.slice(1))
    )
  }

  return array1.map(x => [x])
}

export const generateVariants = product => {
  const { options, availableOptions, variants } = product 

  console.log(options, availableOptions, variants)

  if (!options || !availableOptions) return []

  // Map existing variants for easy access and carrying over values
  const existingVairants = (variants || []).reduce((obj, variant) => {
    return {
      ...obj,
      [variant.options.join('|||')]: variant
    }
  }, {})

  const newVariants = getAllCombinations(...availableOptions)
    .map((optionCombo, index) => {
      const comboTitle = `${product.title} - ${optionCombo.join(' / ')}`

      return {
        id: index,
        title: comboTitle,
        name: comboTitle,
        price: product.price,
        image: product.image,

        // Default to previous values if it exists
        ...existingVairants[optionCombo.join('|||')],

        // Set {option1, option2, ...} values
        ...optionCombo.reduce((optsObj, opt, optIndex) => ({ 
          ...optsObj, 
          [`option${optIndex + 1}`]: opt 
        }), {}),

        // Set options array
        options: optionCombo
      }
    })

  return newVariants
}
