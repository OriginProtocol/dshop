import React, { useEffect, useMemo } from 'react'
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
  const mediaFW = get(themeVars, 'home.galleryImagesFW', [])

  const galleryImages = useMemo(() => {
    return media.reduce(
      (out, imgObj, index) => {
        if (index % 2 === 0) {
          out.col1.push(imgObj)
        } else {
          out.col2.push(imgObj)
        }

        return out
      },
      {
        col1: [],
        col2: []
      }
    )
  }, [media])

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
            {get(galleryImages, 'col1', []).map((imgObj) => (
              <div
                key={imgObj.url}
                className="block bg-no-repeat"
                style={{
                  paddingTop: imgObj.height,
                  backgroundSize: imgObj.backgroundSize,
                  backgroundPosition: imgObj.backgroundPosition,
                  backgroundImage: `url(${config.dataSrc}${imgObj.url})`
                }}
              />
            ))}
          </div>
          <div>
            {get(galleryImages, 'col2', []).map((imgObj) => (
              <div
                key={imgObj.url}
                className="block bg-no-repeat"
                style={{
                  paddingTop: imgObj.height,
                  backgroundSize: imgObj.backgroundSize,
                  backgroundPosition: imgObj.backgroundPosition,
                  backgroundImage: `url(${config.dataSrc}${imgObj.url})`
                }}
              />
            ))}
          </div>
        </div>

        {mediaFW.map((imgObj) => (
          <div
            key={imgObj.url}
            className="bg-no-repeat sm:mt-12"
            style={{
              paddingTop: imgObj.height,
              backgroundSize: imgObj.backgroundSize,
              backgroundPosition: imgObj.backgroundPosition,
              backgroundImage: `url(${config.dataSrc}${imgObj.url})`
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
