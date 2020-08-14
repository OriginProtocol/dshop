import React, { useState, useEffect } from 'react'
import zip from 'lodash/zip'
import sortBy from 'lodash/sortBy'
import uniq from 'lodash/uniq'
import fbt from 'fbt'

import useProducts from 'utils/useProducts'
import ProductList from 'components/ProductList'

function resultsFor(productIndex, product) {
  const terms = product.title
    .split(' ')
    .map((i) => i.toLowerCase())
    .filter((term) => ['ethereum'].indexOf(term) < 0)
    .slice(0, 3)

  const results = sortBy(
    terms.map((t) => productIndex.search(t)),
    'length'
  )
  return uniq(
    zip
      .apply(null, results)
      .flat()
      .filter((i) => i && i !== product.id)
  )
}

const SimilarProducts = ({ product, count = 3 }) => {
  const { productIndex, products } = useProducts()
  const [ids, setIds] = useState([])

  useEffect(() => {
    if (product && product.title && productIndex) {
      const newIds = resultsFor(productIndex, product)
      setIds(newIds)
    }
  }, [product, productIndex])

  if (!product || !products.length) return null

  const filteredProducts = ids
    .slice(0, count)
    .map((id) => products.find((p) => p.id === id))

  if (!filteredProducts.length) {
    return null
  }

  return (
    <div className="similar-products">
      <h4 className="mb-3">
        <fbt desc="component.SimilarProducts.title">You might also like</fbt>
      </h4>
      <ProductList products={filteredProducts} />
    </div>
  )
}

export default SimilarProducts

require('react-styl')(`
  .similar-products
    margin-top: 2rem
    border-top: 1px solid #eee
    padding-top: 1rem
`)
