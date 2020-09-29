import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useCollections from 'utils/useCollections'

import Link from 'components/Link'

import Products from './_Products'

const App = () => {
  const { config } = useConfig()
  const { collections } = useCollections()
  return (
    <>
      <div className="container">
        <div className="text-center my-12 sm:my-24">
          <h1 className="text-3xl sm:text-4xl leading-tight mb-4">
            {get(config, 'theme.home.subheading')}
          </h1>
          <div className="text-gray-500 text-sm">{config.byline}</div>
        </div>
        <Products limit={3} />
        <div className="my-16 sm:my-24 flex justify-center">
          <Link to="/products" className="btn flex-1 sm:flex-none">
            {`View ${get(collections, '0.title', 'All Products')}`}
          </Link>
        </div>
      </div>
      <div className="sm:container">
        <About />
      </div>
    </>
  )
}

const About = () => {
  const { config } = useConfig()
  const img = `url(${config.dataSrc}${get(config, 'theme.home.aboutImage')})`
  const paddingTop = get(config, 'theme.home.aboutImageHeight')
  return (
    <div className="bg-gray-100 p-8 sm:p-4 border-t border-b sm:border-l sm:border-r border-gray-400 grid grid-cols-1 sm:grid-cols-2">
      <div
        className="bg-contain bg-no-repeat order-last sm:order-first"
        style={{ backgroundImage: img, paddingTop }}
      />
      <div className="sm:px-12 flex flex-col items-start justify-center mb-16 sm:mb-0">
        <div className="text-3xl sm:text-4xl leading-tight mb-8 sm:mb-16">
          {get(config, 'theme.home.aboutText')}
        </div>
        <Link to="/about" className="btn self-stretch sm:self-auto">
          Learn More
        </Link>
      </div>
    </div>
  )
}

export default App
