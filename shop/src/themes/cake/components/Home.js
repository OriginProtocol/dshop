import React from 'react'
import get from 'lodash/get'

import Link from 'components/Link'
import useThemeVars from 'utils/useThemeVars'
import useConfig from 'utils/useConfig'
import Products from './_Products'
import usePalette from '../hoc/usePalette'

const App = () => {
  const themeVars = useThemeVars()
  const { config } = useConfig()
  const headerImageUrl = `${config.dataSrc}${get(
    themeVars,
    'home.headerImage.0.url'
  )}`
  const headerText = get(themeVars, 'home.headerText')
  const { colors, fonts } = usePalette()

  return (
    <>
      <div className="container mb-20">
        <div className="text-center my-2">
          <h1
            className={`text-3xl sm:text-5xl leading-tight font-${fonts.header} font-bold font-serif whitespace-pre-line`}
          >
            {headerText}
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
        <h2
          className={`text-2xl sm:text-5xl leading-tight font-${fonts.header} font-bold font-serif mb-20`}
        >
          Featured Desserts
        </h2>
        <Products cols={2} limit={2} onlyFeatured />
      </div>

      <div className="container">
        <Products offset={2} limit={3} onlyFeatured />

        <div className="my-24 flex justify-center">
          <Link
            to="/products"
            className={`btn btn-primary bg-${colors.buttonColor}`}
          >
            View All Products
          </Link>
        </div>
      </div>
    </>
  )
}

export default App
