import React from 'react'
import get from 'lodash/get'

import useAbout from 'utils/useAbout'
import useConfig from 'utils/useConfig'

import Header from './_Header'
import Footer from './_Footer'

const About = () => {
  const { config } = useConfig()
  const { about } = useAbout()

  const section = get(config, 'theme.about.section', {})
  const header = get(config, 'theme.about.header', {})
  const primaryImage = get(config, 'theme.about.primaryImage', {})

  return (
    <>
      <Header
        style={{
          backgroundImage: `url(${config.dataSrc}${header.src})`,
          backgroundPosition: header.position
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
              backgroundSize: primaryImage.size,
              backgroundImage: `url(${config.dataSrc}${primaryImage.src})`,
              backgroundPosition: primaryImage.position
            }}
            className="bg-no-repeat bg-center"
          />
        </div>
        <div style={{ flex: '1' }} className=" order-1 sm:order-2">
          {!about ? null : (
            <div
              className="text-lg sm:text-xl p-4 py-8 sm:p-12 whitespace-pre-line font-light"
              dangerouslySetInnerHTML={{ __html: about }}
            />
          )}
        </div>
      </div>
      <div className="bg-orange-100 pb-20">
        <div className="container text-gray-600 text-center py-12 sm:py-24 text-lg sm:text-2xl leading-tight font-light">
          {section.description}
        </div>
        <div className="sm:container">
          <div className="flex gap-4 sm:gap-10">
            <div className="flex-1 flex flex-col gap-4 sm:gap-10">
              {get(config, 'theme.about.section.images[0]', []).map(
                (img, idx) => (
                  <div
                    key={idx}
                    className="bg-no-repeat"
                    style={{
                      paddingTop: img.height,
                      backgroundSize: img.size,
                      backgroundPosition: img.position,
                      backgroundImage: `url(${config.dataSrc}${img.src})`
                    }}
                  />
                )
              )}
            </div>
            <div className="flex-1 flex flex-col gap-4 sm:gap-10">
              {get(config, 'theme.about.section.images[1]', []).map(
                (img, idx) => (
                  <div
                    key={idx}
                    className="bg-no-repeat"
                    style={{
                      flex: img.flex,
                      backgroundSize: img.size,
                      backgroundPosition: img.position,
                      backgroundImage: `url(${config.dataSrc}${img.src})`
                    }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default About
