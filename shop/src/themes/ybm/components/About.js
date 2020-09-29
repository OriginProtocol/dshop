import React from 'react'
import get from 'lodash/get'

import useAbout from 'utils/useAbout'
import useConfig from 'utils/useConfig'

import Header from './_Header'
import Footer from './_Footer'

const About = () => {
  const { config } = useConfig()
  const { about } = useAbout()
  // const src = `${config.dataSrc}${get(config, 'theme.home.aboutImage')}`
  const src = `ybm/official-ybm-distressed-dad-hat-alternate/orig/2ebf65b9c0d60c039a6c3afe41dc1ae0.jpg`

  return (
    <>
      <Header
        style={{
          backgroundImage: 'url(ybm/header-2.jpg)',
          backgroundPosition: 'center 20%'
        }}
      >
        <div className="container text-center text-5xl pt-20 pb-40">
          About Young Black Money Merch
        </div>
      </Header>
      <div className="container my-16 flex">
        <div
          style={{
            paddingTop: '56%',
            backgroundSize: '120%',
            backgroundImage: `url(${src})`,
            backgroundPosition: 'center top'
          }}
          className="flex-1 bg-no-repeat bg-center bg-cover"
        />
        <div style={{ flex: '1' }}>
          {!about ? null : (
            <div
              className="text-xl p-12 whitespace-pre-line font-light"
              dangerouslySetInnerHTML={{ __html: about }}
            />
          )}
        </div>
      </div>
      <div className="bg-gray-100 pb-20">
        <div className="container text-gray-600 text-center py-12 sm:py-24 text-lg sm:text-2xl leading-tight font-light">
          Currently we provide Music Publishing/Distribution, Artist/Group
          Management, Artist/Group Consultations, and Digital Web Presence
          Creation/Managment (e-Commerce platforms, Social Media, Youtube, etc).
        </div>
        <div className="container">
          <div className="flex gap-10">
            <div className="flex-1 flex flex-col gap-10">
              <div
                className="bg-no-repeat"
                style={{
                  paddingTop: '71%',
                  backgroundSize: '200%',
                  backgroundPosition: '50% 43%',
                  backgroundImage:
                    'url(ybm/official-leano-pandemic-ep-hoodie/orig/eaebc5de0c8bc2127f46cafa2832b3fb.jpg)'
                }}
              />
              <div
                className="bg-no-repeat"
                style={{
                  paddingTop: '128%',
                  backgroundSize: '175%',
                  backgroundImage:
                    'url(ybm/official-leano-pandemic-ep-distressed-dad-hat/orig/e70a1b9c7cb356b4a77d3610a6562c64.jpg)'
                }}
              />
            </div>
            <div className="flex-1 flex flex-col gap-10">
              <div
                className="bg-no-repeat"
                style={{
                  flex: '71%',
                  backgroundSize: '150%',
                  backgroundPosition: '32% 50%',
                  backgroundImage:
                    'url(ybm/official-ybm-embroidered-champion-backpack/orig/952bfdecab4e54c04e5a4900fb56785d.jpg)'
                }}
              />
              <div
                className="bg-no-repeat"
                style={{
                  flex: '31%',
                  backgroundSize: '200%',
                  backgroundPosition: '42% 60%',
                  backgroundImage:
                    'url(ybm/official-ybm-iphone-case/orig/5dadeb09b1a1e74c47775e53a8f7f177.jpg)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default About
