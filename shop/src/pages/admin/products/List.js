import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import useProducts from 'utils/useProducts'
import usePaginate from 'utils/usePaginate'
import useSearchQuery from 'utils/useSearchQuery'

import Paginate from 'components/Paginate'
import NoItems from 'components/NoItems'
import Link from 'components/Link'
import useConfig from 'utils/useConfig'
import formatPrice from 'utils/formatPrice'
import sortProducts from 'utils/sortProducts'
import useCollections from 'utils/useCollections'

import DeleteButton from './_Delete'

const AdminProducts = () => {
  const { config } = useConfig()
  const { products, loading: productsLoading } = useProducts()
  const { collections, loading: collectionsLoading } = useCollections()
  const { start, end } = usePaginate()
  const opts = useSearchQuery()

  const location = useLocation()
  const history = useHistory()

  const sortedProducts = sortProducts(products, opts.sort)
  const pagedProducts = sortedProducts.slice(start, end)

  const loading = productsLoading || collectionsLoading
  const hasNoProducts = !loading && pagedProducts.length === 0

  const sortByColumnCallback = (column) => {
    return (e) => {
      e.preventDefault()

      let newSort = `${column}-ascending`

      if (opts.sort && opts.sort.startsWith(column)) {
        newSort = opts.sort.endsWith('-ascending')
          ? `${column}-descending`
          : `${column}-ascending`
      }

      history.replace({
        pathname: location.pathname,
        search: `?sort=${newSort}`
      })
    }
  }

  const getSortIcon = (column) => {
    if (!opts.sort || !opts.sort.startsWith(column)) {
      return null
    }

    return opts.sort.endsWith('-ascending') ? <> &#8593;</> : <> &#8595;</>
  }

  const getCollections = (product) => {
    const result = collections
      .filter((c) => c.products.includes(product.id))
      .map((c) => c.title)

    return result.length ? result.join(', ') : null
  }

  return (
    <div
      className={`admin-products-page${hasNoProducts ? ' no-products' : ''}`}
    >
      <h3 className="admin-title">
        Products
        {hasNoProducts ? null : (
          <>
            <span className="ml-2">({sortedProducts.length})</span>
            <div className="actions">
              <Link
                to="/admin/products/new"
                className="btn btn-primary"
                children="Add Product"
              />
            </div>
          </>
        )}
      </h3>

      {hasNoProducts ? (
        <NoProductsBanner />
      ) : (
        <table className="table admin-products table-hover">
          <thead>
            <tr>
              <th onClick={sortByColumnCallback('title')}>
                Name {getSortIcon('title')}
              </th>
              <th onClick={sortByColumnCallback('title')}></th>
              <th onClick={sortByColumnCallback('price')}>
                Price {getSortIcon('price')}
              </th>
              <th>Collections</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map((product) => (
              <tr
                key={product.id}
                onClick={(e) => {
                  if (e.target.matches('.action-icon, .action-icon *')) {
                    return
                  }
                  history.push(`/admin/products/${product.id}`)
                }}
              >
                <td>
                  <div
                    className={`pic${product.image ? '' : ' empty'}`}
                    style={{
                      backgroundImage: product.image
                        ? `url(${config.dataSrc}${product.id}/520/${product.image})`
                        : null
                    }}
                  />
                </td>
                <td>
                  <div className="title">{product.title}</div>
                </td>
                <td>
                  <div className="price">{formatPrice(product.price)}</div>
                </td>
                <td>{getCollections(product)}</td>
                <td>
                  <div className="actions">
                    <div className="action-icon">
                      <Link to={`/admin/products/${product.id}`}>
                        <img src="images/edit-icon.svg" />
                      </Link>
                    </div>
                    <DeleteButton product={product} className="action-icon">
                      <img src="images/delete-icon.svg" />
                    </DeleteButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Paginate total={products.length} />
    </div>
  )
}

const NoProductsBanner = () => (
  <NoItems
    heading="Add your products"
    description="Get closer to your first sale by adding products."
    linkTo="/admin/products/new"
    buttonText="Add Product"
  />
)

export default AdminProducts

require('react-styl')(`
  .admin-products
    line-height: 1.25rem
    tr
      td:first-child
        width: 80px
      td
        vertical-align: middle
    .title
      font-weight: 600
      color: #000
    .price
      color: #666
      font-size: 14px
    .pic
      width: 60px
      height: 50px
      background-size: contain
      background-repeat: no-repeat
      background-position: center
      &.empty
        background-color: var(--light)
        background-image: url(images/default-image.svg)
        background-size: 50%
  .admin-products-page
    h3 span
      color: #9faebd

    .action-icon
      border: 0
      background-color: transparent

    &.no-products
      display: flex
      flex-direction: column
      height: 100%

`)
