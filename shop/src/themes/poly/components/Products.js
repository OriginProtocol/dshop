import React from 'react'

import Products from './_Products'

const AllProducts = () => {
  return (
    <div className="container mb-12 sm:mb-24">
      <div className="text-center text-3xl sm:text-5xl font-medium my-12 sm:my-24">
        Products
      </div>
      <Products />
    </div>
  )
}

export default AllProducts
