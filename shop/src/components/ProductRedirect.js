import React from 'react'
import { Redirect } from 'react-router-dom'

import useProducts from 'utils/useProducts'

const ProductRedirect = () => {
  const { products } = useProducts()
  if (products && products.length) {
    return <Redirect to={`/product/${products[0].id}`} />
  }

  return null
}

export default ProductRedirect
