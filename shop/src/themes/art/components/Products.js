import React from 'react'

import Header from './_Header'
import Footer from './_Footer'
import Products from './_Products'

const AllProducts = () => {
  return (
    <>
      <Header />

      <div className="container">
        <div className="text-center text-4xl font-medium mb-24">All Prints</div>
        <Products />
      </div>

      <Footer />
    </>
  )
}

export default AllProducts
