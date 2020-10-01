import React from 'react'
import get from 'lodash/get'

import useCollections from 'utils/useCollections'

import Products from './_Products'

const AllProducts = () => {
  const { collections } = useCollections()
  return (
    <div className="container">
      <div className="text-center text-4xl font-medium mb-24">
        {get(collections, '0.title')}
      </div>
      <Products />
    </div>
  )
}

export default AllProducts
