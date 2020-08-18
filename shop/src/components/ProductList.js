import React from 'react'
import { useHistory, useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'
import fbt from 'fbt'
import Link from 'components/Link'
import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import useCurrencyOpts from 'utils/useCurrencyOpts'

function altClick(e) {
  return e.button === 0 && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey
}

const ProductList = ({ products }) => {
  const history = useHistory()
  const match = useRouteMatch('/collections/:collection')
  const { config } = useConfig()
  const collectionParam = get(match, 'params.collection')
  const urlPrefix = collectionParam ? `/collections/${collectionParam}` : ''

  const currencyOpts = useCurrencyOpts()

  return (
    <div className="products">
      {products.length ? null : <div>No Products!</div>}
      {products.map((product) => {
        let img
        if (product.image) {
          img = `${config.dataSrc}${product.id}/520/${product.image}`
          if (product.data) {
            img = `${config.ipfsGateway}${product.data}/520/${product.image}`
          }
          img = { backgroundImage: `url(${img})` }
        }
        return (
          <div
            key={product.id}
            className="product"
            onClick={(e) => {
              const pathname = `${urlPrefix}/products/${product.id}`
              if (altClick(e)) {
                history.push({ pathname, state: { scrollToTop: true } })
              } else {
                window.open(`#${pathname}`, '_blank')
              }
            }}
          >
            <div className={`pic${!img ? ' empty' : ''}`} style={img} />
            <div className="product-body">
              <Link to={`${urlPrefix}/products/${product.id}`}>
                {product.title}
              </Link>
              <div className="price">
                {product.variantPricing
                  ? `${fbt('From', 'component.ProductList.fromPrice')} `
                  : ''}
                {formatPrice(product.price, currencyOpts)}
                {config.freeShipping ? (
                  <span className="shipping">
                    <fbt desc="product.freeShipping">FREE Shipping</fbt>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ProductList
