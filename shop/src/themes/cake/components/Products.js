import React, { useMemo } from 'react'
import get from 'lodash/get'
import { useRouteMatch } from 'react-router-dom'

import useCollections from 'utils/useCollections'

import Header from './_Header'
import Footer from './_Footer'
import Products from './_Products'

const AllProducts = () => {
  const { collections } = useCollections()
  const match = useRouteMatch('/products/:collection')

  const collectionId = get(match, 'params.collection')

  const collectionTitle = useMemo(() => {
    if (!collectionId) return null

    const collection = collections.find((c) => c.id == collectionId)

    if (collection) return collection.title

    return null
  }, [collectionId, collections])

  return (
    <>
      <Header />

      <div className="container">
        {!collectionTitle ? null : (
          <div className="text-center text-4xl font-medium mb-24">
            {collectionTitle}
          </div>
        )}
        <Products />
      </div>

      <Footer />
    </>
  )
}

export default AllProducts
