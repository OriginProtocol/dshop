import React, { useMemo } from 'react'
import get from 'lodash/get'

import useAbout from 'utils/useAbout'
import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

import Header from './_Header'
import Footer from './_Footer'

const About = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()

  const aboutText = get(themeVars, 'about.aboutText')
  const aboutDescription = get(themeVars, 'about.description')
  const header = get(themeVars, 'about.headerImage.0', {})
  const primaryImage = get(themeVars, 'about.primaryImage.0', {})
  const aboutImages = useMemo(() => {
    const allImages = get(themeVars, 'about.aboutImages', [])
    const col1Images = []
    const col2Images = []

    allImages.map((img, index) => {
      if (index % 2 === 0) {
        col1Images.push(img)
      } else {
        col2Images.push(img)
      }
    })

    return {
      col1Images,
      col2Images
    }
  }, [themeVars])

  return (
    <>
      <Header
        style={{
          backgroundImage: `url(${config.dataSrc}${header.url})`,
          backgroundPosition: header.backgroundPosition
        }}
      >
        <div className="container text-center text-3xl sm:text-5xl pt-20 pb-32 sm:pb-40">
          {`About ${config.title}`}
        </div>
      </Header>
      <div className="sm:container sm:my-16 flex flex-col sm:flex-row">
        <div className="flex-1 order-2 sm:order-1">
          <div
            style={{
              paddingTop: primaryImage.height,
              backgroundSize: primaryImage.backgroundSize,
              backgroundImage: `url(${config.dataSrc}${primaryImage.url})`,
              backgroundPosition: primaryImage.backgroundPosition
            }}
            className="bg-no-repeat bg-center"
          />
        </div>
        <div style={{ flex: '1' }} className=" order-1 sm:order-2">
          {!aboutText ? null : (
            <div
              className="text-lg sm:text-xl p-4 py-8 sm:p-12 whitespace-pre-line font-light"
              children={aboutText}
            />
          )}
        </div>
      </div>
      <div className="bg-orange-100 pb-20">
        <div className="container text-gray-600 text-center py-12 sm:py-24 text-lg sm:text-2xl leading-tight font-light">
          {aboutDescription}
        </div>
        <div className="sm:container">
          <div className="flex gap-4 sm:gap-10">
            <div className="flex-1 flex flex-col gap-4 sm:gap-10">
              {aboutImages.col1Images.map((img, idx) => (
                <div
                  key={idx}
                  className="bg-no-repeat"
                  style={{
                    paddingTop: img.height,
                    backgroundSize: img.backgroundSize,
                    backgroundPosition: img.backgroundPosition,
                    backgroundImage: `url(${config.dataSrc}${img.url})`
                  }}
                />
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-4 sm:gap-10">
              {aboutImages.col2Images.map((img, idx) => (
                <div
                  key={idx}
                  className="bg-no-repeat"
                  style={{
                    paddingTop: img.height,
                    backgroundSize: img.backgroundSize,
                    backgroundPosition: img.backgroundPosition,
                    backgroundImage: `url(${config.dataSrc}${img.url})`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default About
