import React from 'react'
import get from 'lodash/get'

import useCollections from 'utils/useCollections'

import Header from './_Header'
import Footer from './_Footer'
import Products from './_Products'

const AllProducts = () => {
  const { collections } = useCollections()
  return (
    <>
      <Header />
      <div className="container">
        <div className="text-center text-4xl font-medium mb-24">
          {get(collections, '0.title')}
        </div>
        <Products />
      </div>
      <Footer />
    </>
  )
}

export default AllProducts
