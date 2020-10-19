import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

import SocialLink from 'components/SocialLink'

import Header from './_Header'
import Footer from './_Footer'

const Contact = () => {
  const { config } = useConfig()

  const themeVars = useThemeVars()
  const contact = get(themeVars, 'contact', {})
  const headerImage = `${config.dataSrc}${get(
    themeVars,
    'contact.headerImage.0'
  )}`
  const contactEmail = get(themeVars, 'contact.email', config.supportEmail)
  const contactNumber = get(themeVars, 'contact.number', config.supportPhone)

  return (
    <>
      <Header
        style={{
          backgroundImage: `url(${get(headerImage, 'url')})`,
          backgroundPosition: get(headerImage, 'backgroundPosition')
        }}
      >
        <div className="container text-center text-2xl sm:text-5xl py-20 sm:pb-40">
          Contact
        </div>
      </Header>
      <div className="container my-16 sm:my-32 flex flex-col sm:flex-row text-center gap-12">
        <div className="flex-1 flex flex-col items-center gap-6">
          <div className="text-3xl text-center leading-none">
            {contact.title}
          </div>
          <div className="font-light text-lg whitespace-pre">
            {contact.description}
          </div>
          <div className="flex-1 flex gap-8 order-2 sm:order-1">
            <SocialLink
              href={config.twitter}
              svg={{ height: '18', color: '#000' }}
            />
            <SocialLink
              href={config.facebook}
              svg={{ height: '18', color: '#000' }}
            />
            <SocialLink
              href={config.instagram}
              svg={{ height: '18', color: '#000' }}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-6 font-light">
          <div className="text-2xl text-center leading-none text-gray-600">
            Email
          </div>
          <div className="text-2xl sm:text-4xl text-center leading-none">
            {contactEmail}
          </div>
          {!contactNumber ? null : (
            <>
              <div className="mt-12 text-2xl text-center leading-none text-gray-600">
                Phone
              </div>
              <div className="text-2xl sm:text-4xl text-center leading-none">
                {contactNumber}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Contact
