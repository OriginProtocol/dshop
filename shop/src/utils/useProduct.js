import { useEffect, useReducer } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import queryString from 'query-string'
import get from 'lodash/get'
import pick from 'lodash/pick'
import isEqual from 'lodash/isEqual'

import fetchProduct from 'data/fetchProduct'
import { useStateValue } from 'data/state'
import formatPrice from 'utils/formatPrice'
import useCurrencyOpts from 'utils/useCurrencyOpts'

const reducer = (state, newState) => ({ ...state, ...newState })

function getImageForVariant(product, variant) {
  if (product && get(variant, 'image')) {
    const variantImage = product.images.findIndex(
      (i) => variant.image.indexOf(i) >= 0
    )
    return variantImage > 0 ? variantImage : 0
  }
}

function getOptions(product, offset) {
  const options = new Set(
    product.variants.map((variant) => variant.options[offset])
  )
  return Array.from(options)
}

/**
 * Finds and returns the variant that has the cheapest price
 *
 * @param {Array<Object>} variants
 * @returns {Object}
 */
function findCheapestVariant(variants, productPrice) {
  if (variants.length <= 1) return variants[0]

  let minPrice = get(variants, '0.price', productPrice)
  let foundVariant

  for (const variant of variants) {
    if (variant.price < minPrice) {
      minPrice = variant.price
      foundVariant = variant
    }
  }

  return foundVariant ? foundVariant : variants[0]
}

function useProduct(id) {
  const [{ config }] = useStateValue()
  const location = useLocation()
  const history = useHistory()
  const opts = queryString.parse(location.search)
  const currencyOpts = useCurrencyOpts()
  const [state, setState] = useReducer(reducer, {
    loading: true,
    options: {},
    activeImage: 0,
    addedToCart: false,
    product: undefined
  })

  useEffect(() => {
    async function setData(data) {
      if (!data) {
        setState({ loading: false, product: undefined })
        return
      }

      if (data.image) {
        data.imageUrl = `${config.dataSrc}${data.id}/520/${data.image}`
      }

      if (data.images) {
        data.imageUrls = data.images.map(
          (image) => `${config.dataSrc}${data.id}/520/${image}`
        )
      }

      const variants = get(data, 'variants', [])
      if (!variants.length) {
        variants.push({
          ...pick(data, ['title', 'price', 'image', 'sku', 'imageUrl']),
          id: 0,
          name: data.title,
          options: [],
          option1: null,
          option2: null,
          option3: null,
          available: true
        })
      }
      variants.forEach((variant) => {
        if (variant.image) {
          variant.imageUrl = `${config.dataSrc}${data.id}/520/${variant.image}`
        }
      })

      const variant =
        variants.find((v) => String(v.id) === opts.variant) ||
        findCheapestVariant(variants, data.price)

      const newState = {
        product: data,
        activeImage: 0,
        addedToCart: false,
        loading: false,
        options: pick(variant, 'option1', 'option2', 'option3')
      }

      const imageForVariant = getImageForVariant(data, variant)
      if (imageForVariant !== undefined) {
        newState.activeImage = imageForVariant
      }
      setState(newState)
    }
    setState({ loading: true })
    fetchProduct(config.dataSrc, id).then(setData)
  }, [id])

  const variants = get(state.product, 'variants', []).map((variant) => {
    return {
      ...variant,
      priceStr: formatPrice(get(variant, 'price', 0), currencyOpts)
    }
  })
  const variant = variants.find((v) =>
    isEqual(state.options, pick(v, 'option1', 'option2', 'option3'))
  )

  function setOption(idx, value) {
    const newOptions = {
      ...state.options,
      [`option${idx}`]: value
    }
    const variant = state.product.variants.find((v) =>
      isEqual(newOptions, pick(v, 'option1', 'option2', 'option3'))
    )
    const newState = { options: newOptions }
    const imageForVariant = getImageForVariant(state.product, variant)
    if (imageForVariant !== undefined) {
      newState.activeImage = imageForVariant
    }
    setState(newState)

    history.replace({
      pathname: location.pathname,
      search: queryString.stringify({
        variant: variant ? variant.id : undefined
      })
    })
  }

  function setOptionFromImage(activeId) {
    const productOptions = state.product.options || []
    const sizeIdx = productOptions.indexOf('Size')
    const foundVariant = state.product.variants.find((curVariant) => {
      if (sizeIdx >= 0 && productOptions.length > 1) {
        const sizeMatches =
          variant[`option${sizeIdx + 1}`] == curVariant[`option${sizeIdx + 1}`]
        const matches =
          sizeMatches && curVariant.image === state.product.images[activeId]
        return matches
      } else {
        return curVariant.image === state.product.images[activeId]
      }
    })
    if (foundVariant !== undefined) {
      setState({
        options: pick(foundVariant, 'option1', 'option2', 'option3')
      })
      history.replace({
        pathname: location.pathname,
        search: queryString.stringify({ variant: foundVariant.id })
      })
    }
  }

  return {
    ...state,
    setOption,
    setOptionFromImage,
    getOptions,
    variants,
    variant
  }
}

export default useProduct
