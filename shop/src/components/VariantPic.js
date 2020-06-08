import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'

const VariantPic = ({ product, variant }) => {
  const { config } = useConfig()
  const image = get(variant, 'image') || get(product, 'images[0]')
  const url = `${config.dataSrc}${product.id}/orig/${image}`
  return (
    <div className="product-pic" style={{ backgroundImage: `url(${url})` }} />
  )
}
export default VariantPic

require('react-styl')(`
  .product-pic
    width: 100%
    padding-top: 100%
    background-repeat: no-repeat
    background-size: contain
    background-position: center
`)
