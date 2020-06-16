import React from 'react'

import useProducts from 'utils/useProducts'
import usePaginate from 'utils/usePaginate'
import useSearchQuery from 'utils/useSearchQuery'

import Paginate from 'components/Paginate'
import useConfig from 'utils/useConfig'
import formatPrice from 'utils/formatPrice'
import sortProducts from 'utils/sortProducts'
import { Link, useHistory, useLocation } from 'react-router-dom'
import useCollections from 'utils/useCollections'

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

  const getCollection = (product) => {
    const collection = collections.find((c) => c.products.includes(product.id))

    return collection ? collection.title : null
  }

  return (
    <div
      className={`admin-products-page${hasNoProducts ? ' no-products' : ''}`}
    >
      <div className="d-flex justify-content-between mb-3">
        <h3 className="m-0">
          Products{' '}
          {hasNoProducts ? null : <span>({sortedProducts.length})</span>}
        </h3>
        {hasNoProducts ? null : (
          <Link to="/admin/products/new">
            <button className="btn btn-primary ml-3">Add Product</button>
          </Link>
        )}
      </div>

      {!hasNoProducts ? (
        <table className="table admin-products table-hover">
          <thead>
            <tr>
              <th onClick={sortByColumnCallback('title')}>
                Name {getSortIcon('title')}
              </th>
              <th onClick={sortByColumnCallback('title')}></th>
              <th>Quantity</th>
              <th onClick={sortByColumnCallback('price')}>
                Price {getSortIcon('price')}
              </th>
              <th>Collection</th>
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
                    className="pic"
                    style={{
                      backgroundImage: `url(${config.dataSrc}${product.id}/520/${product.image})`
                    }}
                  />
                </td>
                <td>
                  <div className="title">{product.title}</div>
                </td>
                <td>{product.quantity}</td>
                <td>
                  <div className="price">{formatPrice(product.price)}</div>
                </td>
                <td>{getCollection(product)}</td>
                <td>
                  <div className="actions">
                    <div className="action-icon">
                      <Link to={`/admin/products/${product.id}`}>
                        <img src="images/edit-icon.svg" />
                      </Link>
                    </div>
                    <div
                      className="action-icon"
                      onClick={(e) => e.preventDefault()}
                    >
                      <img src="images/delete-icon.svg" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-products-banner">
          <div className="add-product-cta">
            <h3>Add your products</h3>
            <div className="desc">
              Get closer to your first sale by adding products.
              <br />
              Click the button below to get started.
            </div>
            <Link to="/admin/products/new">
              <button className="btn btn-primary">Add Product</button>
            </Link>
          </div>
        </div>
      )}

      <Paginate total={products.length} />
    </div>
  )
}

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
  .admin-products-page
    .btn.btn-primary
      width: 175px

    h3 span
      color: #9faebd

    &.no-products
      display: flex
      flex-direction: column
      height: 100%
      .no-products-banner
        flex: 1
        background-image: url('/images/cart-graphic.svg')
        display: flex
        align-items: center

        .add-product-cta
          .desc
            font-size: 1rem
            color: #8293a4

          h3
            font-family: Lato
            font-size: 1.5rem
            font-weight: bold
            color: #000000

          .btn
            margin: 2.5rem 0 3.5rem 0

`)
