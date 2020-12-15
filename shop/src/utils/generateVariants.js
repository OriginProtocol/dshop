const combinationsOfElementAndArray = (element, arr) => {
  let accumulator = []
  if (arr.length === 0) {
    accumulator = [...accumulator, [element, arr[0]]]
  }
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      accumulator = [...accumulator, [element, ...arr[i]]]
    } else {
      accumulator = [...accumulator, [element, arr[i]]]
    }
  }
  return accumulator
}

const combinationsOfTwoArrays = (array1, array2) => {
  let combinations = []
  if (array1.length === 0) {
    combinations = [
      ...combinations,
      ...combinationsOfElementAndArray(array1[0], array2)
    ]
  }
  for (let j = 0; j < array1.length; j++) {
    combinations = [
      ...combinations,
      ...combinationsOfElementAndArray(array1[j], array2)
    ]
  }
  return combinations
}

export const getAllCombinations = (array1, ...arrays) => {
  if (arrays.length === 1) return combinationsOfTwoArrays(array1, arrays[0])
  else if (arrays.length >= 2)
    return combinationsOfTwoArrays(
      array1,
      getAllCombinations(arrays[0], ...arrays.splice(1))
    )
}

export const generateVariants = (product) => {
  const { options, availableOptions, variants } = product

  if (!options || !availableOptions) return []
  if (!options.length || !availableOptions.length) return []

  // Map existing variants for easy access and carrying over values
  const existingVariants = (variants || []).reduce((obj, variant) => {
    return {
      ...obj,
      [variant.options.join('|||')]: variant
    }
  }, {})

  const newVariants = getAllCombinations(...availableOptions).map(
    (optionCombo, index) => {
      const comboTitle = `${product.title} - ${optionCombo.join(' / ')}`

      return {
        id: index,
        title: comboTitle,
        name: comboTitle,
        price: product.price,
        image: product.image,
        available: true,

        // Default to previous values if it exists
        ...existingVariants[optionCombo.join('|||')],

        // Set {option1, option2, ...} values
        ...optionCombo.reduce(
          (optsObj, opt, optIndex) => ({
            ...optsObj,
            [`option${optIndex + 1}`]: opt
          }),
          {}
        ),

        // Set options array
        options: optionCombo
      }
    }
  )

  return newVariants
}
