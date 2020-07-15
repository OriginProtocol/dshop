import React from 'react'

import useConfig from 'utils/useConfig'

const ProductImage = ({ product, className }) => {
  const { config } = useConfig()

  let cls = `admin-product-image${product.image ? '' : ' empty'}`
  if (className) cls = `${cls} ${className}`

  return (
    <div
      className={cls}
      style={{
        backgroundImage: product.image
          ? `url(${config.dataSrc}${product.id}/520/${product.image})`
          : null
      }}
    />
  )
}

export default ProductImage

require('react-styl')(`
  .admin-product-image
    width: 60px
    height: 50px
    background-size: contain
    background-repeat: no-repeat
    background-position: center
    &.empty
      background-color: var(--light)
      background-image: url(images/default-image.svg)
      background-size: 50%
`)
