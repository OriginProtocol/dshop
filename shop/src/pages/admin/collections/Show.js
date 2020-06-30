import React, { useMemo, useEffect } from 'react'
import { useRouteMatch } from 'react-router-dom'

import get from 'lodash/get'

import DeleteButton from './_Delete'
import Link from 'components/Link'
import useCollections from 'utils/useCollections'
import useProducts from 'utils/useProducts'
import useBackendApi from 'utils/useBackendApi'

import SortableTable from 'components/SortableTable'
import NoItems from 'components/NoItems'

const ShowCollection = () => {
  const { collections, reload } = useCollections()
  const { products } = useProducts()
  const match = useRouteMatch('/admin/collections/:collectionId')
  const { collectionId } = match.params

  const { post } = useBackendApi({ authToken: true })

  const collection = useMemo(() => {
    if (!products || !collections || !products.length || !collections.length)
      return null

    const collection = collections.find((c) => c.id === collectionId)

    return {
      ...collection,
      products: get(collection, 'products', []).map((pId) =>
        products.find((p) => p.id === pId)
      )
    }
  }, [collections, collectionId, products])

  // TODO: Should reload after save, but it adds unwanted jerkiness
  useEffect(() => reload(), [])

  if (!collection) {
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
        <div className="actions ml-auto">
          {!collection ? null : (
            <DeleteButton className="mr-2" collection={collection} />
          )}
        </div>
      </h3>
      {collection.products.length ? (
        <SortableTable
          items={collection.products}
          onClick={() => {}}
          onChange={(products) => {
            post(`/collections/${collection.id}`, {
              body: JSON.stringify({
                ...collection,
                products: products.map((p) => p.id)
              }),
              method: 'PUT'
            })
          }}
          labels={['Product', 'Image']}
        >
          {(product, DragTarget) => (
            <>
              <div className="td title">
                <div className="draggable-content" draggable>
                  <DragTarget />
                  {product.title}
                </div>
              </div>
              <div className="td justify-content-center">
                <img
                  className="linked-product-image"
                  src={`/${localStorage.activeShop}/${product.id}/orig/${product.image}`}
                />
              </div>
            </>
          )}
        </SortableTable>
      ) : (
        <NoItems
          heading="Add a product"
          description="Add a product to collection."
          linkTo="/admin/products"
          buttonText="Add products to collection"
        />
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
