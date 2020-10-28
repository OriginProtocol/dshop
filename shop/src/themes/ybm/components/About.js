import React from 'react'
import get from 'lodash/get'

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
  const aboutImages = get(themeVars, 'about.aboutImages', [])

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
        {!primaryImage.url ? null : (
          <div className="flex-1 order-2 sm:order-1 bg-cover bg-no-repeat bg-center">
            <div
              style={{
                paddingTop: '128%',
                backgroundImage: `url(${config.dataSrc}${primaryImage.url})`
              }}
              className="bg-no-repeat bg-center bg-contain"
            />
          </div>
        )}
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
              {aboutImages.slice(0, 2).map((img, idx) => (
                <div
                  key={idx}
                  className="bg-no-repeat bg-center bg-cover"
                  style={{
                    paddingTop: idx === 0 ? '71%' : '128%',
                    backgroundImage:
                      !img || !img.url
                        ? null
                        : `url(${config.dataSrc}${img.url})`
                  }}
                />
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-4 sm:gap-10">
              {aboutImages.slice(2, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="bg-no-repeat bg-center bg-cover"
                  style={{
                    paddingTop: idx === 0 ? '128%' : '71%',
                    backgroundImage:
                      !img || !img.url
                        ? null
                        : `url(${config.dataSrc}${img.url})`
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
