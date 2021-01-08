import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

import Link from 'components/Link'

import Products from './_Products'

const App = () => {
  const themeVars = useThemeVars()

  return (
    <>
      <div className="container">
        <div className="text-center my-12 sm:my-24">
          <h1 className="text-3xl sm:text-4xl leading-tight mb-4 whitespace-pre-line">
            {get(themeVars, 'home.subheading')}
          </h1>
          <div className="text-sm text-secondary">
            {get(themeVars, 'home.tagline')}
          </div>
        </div>
        <Products limit={3} onlyFeatured />
        <div className="my-16 sm:my-24 flex justify-center">
          <Link to="/products" className="btn flex-1 sm:flex-none">
            View All Products
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
  const themeVars = useThemeVars()

  const relPath = get(themeVars, 'home.aboutImage.0.url')
  const img = `url(${config.dataSrc}${relPath})`
  return (
    <div className="bg-gray-100 p-8 sm:p-4 border-t border-b sm:border-l sm:border-r border-gray-400 grid grid-cols-1 sm:grid-cols-2">
      {!relPath ? null : (
        <div
          className="bg-cover bg-no-repeat bg-center order-last sm:order-first"
          style={{ backgroundImage: img, paddingTop: '126%' }}
        />
      )}
      <div className="sm:px-12 flex flex-col items-start justify-center mb-16 sm:mb-0">
        <div className="text-3xl sm:text-4xl leading-tight mb-8 sm:mb-16 whitespace-pre-line">
          {get(themeVars, 'home.aboutText')}
        </div>
        <Link to="/about" className="btn self-stretch sm:self-auto">
          Learn More
        </Link>
      </div>
    </div>
  )
}

export default App
