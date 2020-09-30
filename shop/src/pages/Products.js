import React from 'react'
import { useLocation, useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'

import Link from 'components/Link'
import Paginate from 'components/Paginate'

import { useStateValue } from 'data/state'
import useProducts from 'utils/useProducts'
import usePaginate from 'utils/usePaginate'
import useSearchQuery from 'utils/useSearchQuery'
import sortProducts from 'utils/sortProducts'

import ProductList from 'components/ProductList'
import SortBy from 'components/SortBy'

import CreateMug from 'components/custom/CreateMug'
import AffiliateBanner from 'components/custom/AffiliateBanner'

const Products = () => {
  const location = useLocation()
  const opts = useSearchQuery()
  const match = useRouteMatch('/collections/:collection')
  const [{ productIndex, collections }] = useStateValue()
  const { products, loading, error } = useProducts()
  const { start, end } = usePaginate()

  const collectionParam = get(match, 'params.collection')
  let collection = collections.find((c) => c.id === collectionParam)
  const homeCollection = collections.find((c) => c.id === 'home')
  if (!collection && collectionParam === 'all') {
    collection = {
      id: 'all',
      title: fbt('All Products', 'products.allProducts')
    }
  }

  let filteredProducts = products
  const isSearch = location.pathname === '/search' && opts.q
  if (productIndex && isSearch) {
    filteredProducts = productIndex
      .search({ query: opts.q, depth: 1 })
      .map((p) => products.find((product) => product.id === p))
      .filter((p) => p)
  } else if (collection && collection.products) {
    filteredProducts = collection.products
      .map((p) => products.find((product) => product.id === p))
      .filter((p) => p)
  } else if (homeCollection && homeCollection.products) {
    filteredProducts = homeCollection.products
      .map((p) => products.find((product) => product.id === p))
      .filter((p) => p)
  }

  filteredProducts = sortProducts(filteredProducts, opts.sort)

  const pagedProducts = filteredProducts.slice(start, end)

  return (
    <>
      {isSearch ? (
        <div className="collection">
          <div className="breadcrumbs">
            <Link to="/">
              <fbt desc="Home">Home</fbt>
            </Link>
            <span>
              <fbt desc="products.searchBreadcrumbTitle">
                Search for{` `}
                <FbtParam name="searchQuery">{opts.q}</FbtParam>
              </fbt>
            </span>
          </div>
          <div className="d-flex flex-row justify-content-between align-items-center">
            <h3>
              {collection ? (
                collection.title
              ) : (
                <fbt desc="products.searchTitle">
                  Your search for{' '}
                  <FbtParam name="searchQuery">{opts.q}</FbtParam> revealed the
                  following:
                </fbt>
              )}
            </h3>
          </div>
        </div>
      ) : collection ? (
        <div className="collection">
          <div className="breadcrumbs">
            <Link to="/">
              <fbt desc="Home">Home</fbt>
            </Link>
            <span>{collection.title}</span>
          </div>
          <div className="d-flex flex-row justify-content-between align-items-center">
            <h3>{collection.title}</h3>
            <div className="sort-by">
              <SortBy className="form-control form-control-sm" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="collection" />
          <CreateMug />
          <AffiliateBanner />
        </>
      )}

      {error ? (
        <fbt desc="products.loadError">Error loading products</fbt>
      ) : loading ? (
        <>
          <fbt desc="Loading">Loading</fbt>...
        </>
      ) : (
        <ProductList products={pagedProducts} />
      )}

      <Paginate total={filteredProducts.length} />
    </>
  )
}

export default Products

require('react-styl')(`
  .collection
    padding-top: 1rem
    border-top: 1px solid #eee
    margin-bottom: 2rem
    h3
      margin: 0
    .sort-by
      display: flex
      align-items: center
      white-space: nowrap
      select
        margin-left: 0.5rem
  .products
    display: grid
    grid-column-gap: 1.5rem
    grid-row-gap: 1.5rem
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr))
    .product
      .pic
        padding-top: 100%
        background-size: cover
        background-repeat: no-repeat
        background-position: center
        cursor: pointer
        &.empty
          background: var(--light) url(images/default-image.svg)
          background-repeat: no-repeat
          background-position: center
          background-size: 73px 61px
        &:hover
          opacity: 0.5
      .product-body
        text-align: center
        padding-top: 1rem
        margin-bottom: 1rem
        .price
          font-weight: bold
          margin-top: 0.25rem
          span.shipping
            opacity: 0.6
            font-weight: normal
            margin-left: 0.5rem
            font-size: 0.75rem

  @media (max-width: 767.98px)
    .products
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr))

`)
