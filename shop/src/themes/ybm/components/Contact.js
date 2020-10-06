import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'

import SocialLink from 'components/SocialLink'

import Header from './_Header'
import Footer from './_Footer'

const Contact = () => {
  const { config } = useConfig()
  const contact = get(config, 'theme.contact', {})
  const header = get(config, 'theme.contact.header', {})

  return (
    <>
      <Header
        style={{
          backgroundImage: `url(${config.dataSrc}${header.src})`,
          backgroundPosition: header.position
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
          <div className="font-light text-lg">{contact.description}</div>
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
            {config.supportEmail}
          </div>
          {!config.supportPhone ? null : (
            <>
              <div className="mt-12 text-2xl text-center leading-none text-gray-600">
                Phone
              </div>
              <div className="text-2xl sm:text-4xl text-center leading-none">
                {config.supportPhone}
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
