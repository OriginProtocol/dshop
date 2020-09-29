import React from 'react'

import Link from 'components/Link'

import Header from './_Header'
import Footer from './_Footer'
import Products from './_Products'

const Home = () => {
  return (
    <>
      <Header>
        <div
          className="text-center mt-40 text-3xl sm:text-5xl leading-tight mx-auto"
          style={{ maxWidth: 600 }}
        >
          High-quality merch from Atlanta, Georgia since 2017
        </div>
        <div className="text-center pt-12 pb-40">
          <Link to="/products" className="btn btn-primary btn-xl">
            Shop Now
          </Link>
        </div>
      </Header>
      <div className="bg-gray-100">
        <div className="container text-gray-600 text-center py-12 sm:py-24 text-lg sm:text-2xl leading-tight font-light">
          Our mission is to provide a conglomerate of multi-media services to
          metro-Atlanta and its surrounding areas. We promote and support ideas
          from all entrepreneurs, freelancers, business owners, future moguls,
          etc.
        </div>
      </div>
      <div className="sm:container sm:mt-20 mb-32">
        <Products limit={4} />
      </div>
      <div className="text-center mb-32">
        <Link to="/products" className="btn btn-secondary btn-xl">
          View All Products
        </Link>
      </div>
      <Footer />
    </>
  )
}

export default Home
