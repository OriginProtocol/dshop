import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'

import Link from 'components/Link'

import Header from './_Header'
import Footer from './_Footer'
import Collections from './_Collections'

const Home = () => {
  const { config } = useConfig()
  return (
    <>
      <Header>
        <div
          className="text-center mt-24 text-3xl sm:text-5xl leading-tight mx-auto"
          style={{ maxWidth: 600 }}
        >
          {config.byline}
        </div>
        <div className="text-center pt-12 pb-40 sm:pb-60">
          <Link to="/products" className="btn btn-primary btn-xl">
            Shop Now
          </Link>
        </div>
      </Header>
      <div className="bg-orange-100">
        <div className="container text-gray-600 text-center py-12 sm:py-24 text-lg sm:text-2xl leading-tight font-light">
          {get(config, 'theme.home.aboutText')}
        </div>
      </div>
      <div className="sm:container sm:mt-20 mb-32">
        <Collections limit={4} />
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
