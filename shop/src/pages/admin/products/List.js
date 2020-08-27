import React from 'react'
import fbt from 'fbt'
import { useHistory, useLocation } from 'react-router-dom'
import get from 'lodash/get'

import useProducts from 'utils/useProducts'
import usePaginate from 'utils/usePaginate'
import useShopConfig from 'utils/useShopConfig'
import useSearchQuery from 'utils/useSearchQuery'

import ProductImage from 'components/ProductImage'
import Paginate from 'components/Paginate'
import NoItems from 'components/NoItems'
import Link from 'components/Link'
import Price from 'components/Price'
import sortProducts from 'utils/sortProducts'
import useCollections from 'utils/useCollections'

import PrintfulSync from '../settings/apps/PrintfulSync'
import DeleteButton from './_Delete'

const AdminProducts = () => {
  const { products, loading: productsLoading } = useProducts()
  const { collections, loading: collectionsLoading } = useCollections()
  const { start, end } = usePaginate()
  const opts = useSearchQuery()

  const { shopConfig } = useShopConfig()
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

  const actions = get(shopConfig, 'printful') ? (
    <div className="actions">
      <PrintfulSync
        buttonClass="btn btn-primary"
        buttonText={fbt('Sync Printful', 'Sync Printful')}
      />
    </div>
  ) : (
    <div className="actions">
      <Link
        to="/admin/products/new"
        className="btn btn-primary"
        children={<fbt desc="admin.products.addProduct">Add Product</fbt>}
      />
    </div>
  )

  return (
    <div
      className={`admin-products-page${hasNoProducts ? ' no-products' : ''}`}
    >
      <h3 className="admin-title">
        <fbt desc="Products">Products</fbt>
        {hasNoProducts ? null : (
          <>
            <span className="ml-2">({sortedProducts.length})</span>
            {actions}
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
                <fbt desc="Name">Name</fbt> {getSortIcon('title')}
              </th>
              <th onClick={sortByColumnCallback('title')}></th>
              <th onClick={sortByColumnCallback('price')}>
                <fbt desc="Price">Price</fbt> {getSortIcon('price')}
              </th>
              <th>
                <fbt desc="Collections">Collections</fbt>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map((product) => (
              <tr
                key={product.id}
                onClick={(e) => {
                  if (e.target.matches('.actions *')) {
                    e.stopPropagation()
                    return
                  }
                  history.push({
                    pathname: `/admin/products/${product.id}`,
                    state: { scrollToTop: true }
                  })
                }}
              >
                <td>
                  <ProductImage product={product} />
                </td>
                <td>
                  <div className="title">{product.title}</div>
                </td>
                <td>
                  <div className="price">
                    <Price amount={product.price} />
                  </div>
                </td>
                <td>{getCollections(product)}</td>
                <td>
                  {product.externalId ? null : (
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
                  )}
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
