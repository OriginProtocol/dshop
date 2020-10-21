import React, { useMemo } from 'react'
import get from 'lodash/get'

import Link from 'components/Link'
import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

const Home = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()

  const headerText = get(themeVars, 'home.headerText')
  const aboutText = get(themeVars, 'home.aboutText')
  const media = get(themeVars, 'home.galleryImages', [])

  const imageProps = [
    {
      paddingTop: '90%',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    {
      paddingTop: '152%',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    {
      paddingTop: '77%',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    {
      paddingTop: '77%',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    {
      paddingTop: '77%',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  ]

  return (
    <>
      <div className="container">
        <div className="text-3xl sm:text-5xl text-center leading-none my-20 whitespace-pre-line">
          {headerText}
        </div>
      </div>
      <div className="sm:container">
        <div className="grid grid-cols-2 gap-px sm:gap-12">
          <div>
            {media.slice(0, 2).map((imgObj, index) => (
              <Link
                key={index}
                to={`/products/${
                  imgObj && imgObj.productLink ? imgObj.productLink : ''
                }`}
                className="block bg-no-repeat mb-12"
                style={{
                  ...imageProps[index],
                  backgroundImage:
                    imgObj && imgObj.url
                      ? `url(${config.dataSrc}${imgObj.url})`
                      : undefined
                }}
              />
            ))}
          </div>
          <div>
            {media.slice(2, -1).map((imgObj, index) => (
              <div
                key={index}
                className="block bg-no-repeat mb-12"
                style={{
                  ...imageProps[2 + index],
                  backgroundImage:
                    imgObj && imgObj.url
                      ? `url(${config.dataSrc}${imgObj.url})`
                      : undefined
                }}
              />
            ))}
          </div>
        </div>

        {media.slice(-1).map((imgObj, index) => (
          <div
            key={index}
            className="bg-no-repeat sm:mt-12"
            style={{
              paddingTop: '64%',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundImage:
                imgObj && imgObj.url
                  ? `url(${config.dataSrc}${imgObj.url})`
                  : undefined
            }}
          />
        ))}

        <div className="container py-16 sm:py-32 flex flex-col items-center">
          <div className="text-2xl leading-tight max-w-sm text-center mb-12">
            {aboutText}
          </div>
          <Link to="/about" className="btn text-2xl px-10">
            About Us
          </Link>
        </div>
      </div>
    </>
  )
}

export default Home
