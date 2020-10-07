import React from 'react'
import get from 'lodash/get'

import Link from 'components/Link'
import useConfig from 'utils/useConfig'

import Products from './_Products'

const App = () => {
  const { config } = useConfig()
  const headerImageUrl = get(config, 'theme.headerImageUrl')

  return (
    <>
      <div className="container mb-20">
        <div className="text-center my-2">
          <h1 className="text-3xl sm:text-5xl leading-tight font-bold font-serif">
            Delicious Desserts
            <br />
            Delivering to San Diego Today!
          </h1>
        </div>
      </div>

      <div className="mx-auto mb-20" style={{ maxWidth: 1300 }}>
        <div
          className="bg-contain"
          style={{
            backgroundImage: `url(${headerImageUrl})`,
            paddingTop: '43.4%'
          }}
        ></div>
      </div>

      <div className="container mb-20 text-center">
        <h2 className="text-2xl sm:text-5xl leading-tight font-bold font-serif mb-20">
          Featured Desserts
        </h2>
        <Products limit={2} onlyFeatured />
      </div>

      <div className="container">
        <Products limit={3} excludeFeatured />

        <div className="my-24 flex justify-center">
          <Link to="/products" className="btn btn-primary">
            View All Products
          </Link>
        </div>
      </div>
    </>
  )
}

export default App
