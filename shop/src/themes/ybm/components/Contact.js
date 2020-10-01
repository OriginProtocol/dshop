import React from 'react'

import useConfig from 'utils/useConfig'

import SocialLink from 'components/SocialLink'

import Header from './_Header'
import Footer from './_Footer'

const Contact = () => {
  const { config } = useConfig()
  const src = `${config.dataSrc}official-ybm-samsung-case/orig/0c0cc289ad38d1cf9b739c944b75de0b.jpg`

  return (
    <>
      <Header
        style={{
          backgroundImage: `url(${src})`,
          backgroundPosition: '50% 65%'
        }}
      >
        <div className="container text-center text-2xl sm:text-5xl py-20 sm:pb-40">
          Contact
        </div>
      </Header>
      <div className="container my-16 sm:my-32 flex flex-col sm:flex-row text-center gap-12">
        <div className="flex-1 flex flex-col items-center gap-6">
          <div className="text-3xl text-center leading-none">
            Drop us a line
          </div>
          <div className="font-light text-lg">
            If you have any questions or comments, please contact us via email
            or phone. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </div>
          <div className="flex-1 flex gap-8 order-2 sm:order-1">
            <SocialLink
              href={config.twitter}
              svg={{ height: '18', color: '#000' }}
            />
            <SocialLink
              href={config.facebook}
              iconStyle={{ height: '18', color: '#000' }}
            />
            <SocialLink
              href={config.instagram}
              iconStyle={{ height: '18', color: '#000' }}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-6 font-light">
          <div className="text-2xl text-center leading-none text-gray-600">
            Email
          </div>
          <div className="text-2xl sm:text-4xl text-center leading-none">
            contact@ymbmerch.com
          </div>
          <div className="mt-12 text-2xl text-center leading-none text-gray-600">
            Phone
          </div>
          <div className="text-2xl sm:text-4xl text-center leading-none">
            +1 (123) 456-7890
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Contact
