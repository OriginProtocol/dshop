import React, { useReducer, useEffect } from 'react'
import { useRouteMatch, useLocation } from 'react-router-dom'

import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import fbt from 'fbt'

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
    if (!isEqual(state.products, products)) {
      setState({ products })
    }
  }, [collection])

  const onSave = (products) => {
    setState({ products })
    const productIds = products.map((p) => p.id).filter((p) => p)
    const body = JSON.stringify({ products: productIds })
    post(`/collections/${collection.id}`, { method: 'PUT', body })
      .then(() => {
        dispatch({
          type: 'updateCollectionProducts',
          id: collection.id,
          products: productIds
        })
      })
      .catch((err) => {
        console.error(err)
        dispatch({
          type: 'toast',
          style: 'error',
          message: fbt('Error saving', 'admin.collections.saveError')
        })
      })
  }

  if (!collection) {
    if (collections.length && !get(location, 'state.isNew')) {
      return <Redirect to="/admin/collections" />
    }
    return (
      <>
        <fbt desc="Loading">Loading</fbt>...
      </>
    )
  }

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/admin/collections" className="muted">
          <fbt desc="Collections">Collections</fbt>
        </Link>
        <span className="chevron" />
        {collection.title}
        <div className="actions">
          <DeleteButton collection={collection} />
          <EditCollection
            collection={collection}
            className="btn btn-outline-primary"
            children={<fbt desc="Edit">Edit</fbt>}
          />
        </div>
      </h3>
      {collection.products.length ? (
        <>
          <SortableTable
            items={state.products}
            onChange={onSave}
            labels={[fbt('Product', 'Product'), <>&nbsp;</>]}
          >
            {(product, DragTarget) => {
              return (
                <>
                  <div className="td title">
                    <div className="draggable-content" draggable>
                      <DragTarget />
                      <ProductImage product={product} className="mr-2" />
                      {product.title}
                    </div>
                  </div>
                  <div className="td">
                    <button
                      className="btn btn-link btn-sm"
                      onClick={() => {
                        onSave(
                          state.products.filter((p) => p.id !== product.id)
                        )
                      }}
                    >
                      <img src="images/delete-icon.svg" />
                    </button>
                  </div>
                </>
              )
            }}
          </SortableTable>
          <div className="mt-4">
            <AddProducts collection={collection}>
              <fbt desc="admin.collections.editProducts">Edit products</fbt>
            </AddProducts>
          </div>
        </>
      ) : (
        <NoItems
          heading={fbt('Add products', 'admin.collections.addProducts')}
          description={fbt(
            'Add a product to collection.',
            'admin.collections.addProductsDesc'
          )}
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
