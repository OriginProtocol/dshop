import React, { useReducer, useEffect } from 'react'
import { useRouteMatch, useLocation } from 'react-router-dom'

import get from 'lodash/get'

import { useStateValue } from 'data/state'

import DeleteButton from './_Delete'
import EditCollection from './_New'
import Link from 'components/Link'
import Redirect from 'components/Redirect'
import useCollections from 'utils/useCollections'
import useProducts from 'utils/useProducts'
import useBackendApi from 'utils/useBackendApi'

import SortableTable from 'components/SortableTable'
import NoItems from 'components/NoItems'
import ProductImage from 'components/ProductImage'
import AddProducts from './_AddProducts'

const reducer = (state, newState) => ({ ...state, ...newState })

const ShowCollection = () => {
  const [, dispatch] = useStateValue()
  const { products: allProducts } = useProducts()
  const { collections } = useCollections()
  const match = useRouteMatch('/admin/collections/:collectionId')
  const location = useLocation()
  const { collectionId } = match.params
  const { post } = useBackendApi({ authToken: true })
  const collection = collections.find((c) => c.id === collectionId)
  const [state, setState] = useReducer(reducer, {
    products: get(collection, 'products', [])
      .map((pId) => allProducts.find((p) => p.id === pId))
      .filter((p) => p)
  })

  useEffect(() => {
    const products = get(collection, 'products', [])
      .map((pId) => allProducts.find((p) => p.id === pId))
      .filter((p) => p)
    if (state.products.length !== products.length) {
      setState({ products })
    }
  }, [collection])

  const onSave = (products) => {
    setState({ products })

    const body = JSON.stringify({ products: products.map((p) => p.id) })
    post(`/collections/${collection.id}`, { method: 'PUT', body })
      .then(() => {
        dispatch({ type: 'reload', target: 'collections' })
      })
      .catch((err) => {
        console.error(err)
        dispatch({ type: 'toast', style: 'error', message: 'Error saving' })
      })
  }

  if (!collection) {
    if (collections.length && !get(location, 'state.isNew')) {
      return <Redirect to="/admin/collections" />
    }
    return 'Loading...'
  }

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/admin/collections" className="muted">
          Collections
        </Link>
        <span className="chevron" />
        {collection.title}
        <div className="actions">
          <DeleteButton collection={collection} />
          <EditCollection
            collection={collection}
            className="btn btn-outline-primary"
            children="Edit"
          />
        </div>
      </h3>
      {collection.products.length ? (
        <>
          <SortableTable
            items={state.products}
            onChange={onSave}
            labels={['Product']}
          >
            {(product, DragTarget) => {
              return (
                <div className="td title">
                  <div className="draggable-content" draggable>
                    <DragTarget />
                    <ProductImage product={product} className="mr-2" />
                    {product.title}
                  </div>
                </div>
              )
            }}
          </SortableTable>
          <div className="mt-4">
            <AddProducts collection={collection}>Edit products</AddProducts>
          </div>
        </>
      ) : (
        <NoItems
          heading="Add products"
          description="Add a product to collection."
        >
          <AddProducts collection={collection} />
        </NoItems>
      )}
    </>
  )
}

export default ShowCollection

require('react-styl')(`
  .linked-product-image
    width: 64px
    object-fit: contain
`)
