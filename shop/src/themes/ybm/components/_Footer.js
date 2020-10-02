import React from 'react'

import fbt, { FbtParam } from 'fbt'

import useConfig from 'utils/useConfig'

import SocialLink from 'components/SocialLink'

const Footer = () => {
  const { config } = useConfig()
  const date = new Date()
  return (
    <div className="bg-black pt-8 pb-24 text-white text-sm sm:mt-16">
      <div className="container flex items-center flex-col sm:flex-row">
        <div className="flex-1 order-2 sm:order-1 flex">
          <div className="grid grid-flow-col gap-6">
            <SocialLink
              href={config.twitter}
              svg={{ height: '18', color: '#fff' }}
            />
            <SocialLink
              href={config.facebook}
              svg={{ height: '18', color: '#fff' }}
            />
            <SocialLink
              href={config.instagram}
              svg={{ height: '18', color: '#fff' }}
            />
          </div>
        </div>
        <div className="order-1 sm:order-2">
          <img src="ybm/YBM Black trans.PNG" style={{ width: 100 }} />
        </div>
        <div className="flex-1 flex justify-end order-3 mt-8 sm:mt-0">
          <fbt desc="footer.copyrightText">
            &copy; Origin Protocol{' '}
            <FbtParam name="year">{date.getFullYear()}</FbtParam>
          </fbt>
        </div>
      </div>
      <div className="text-gray-600 flex flex-col items-center mt-8">
        <a
          className="order-2 sm:order-1 mt-8 sm:mt-0"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.originprotocol.com/en/dshop"
        >
          <fbt desc="footer.poweredBy">Powered by Origin Dshop</fbt>
        </a>
        <div className="grid gap-2 sm:gap-6 mt-4 order-1 sm:order-2 grid-flow-row sm:grid-flow-col text-center sm:text-left">
          <div>FAQ</div>
          <div>About Dshop</div>
          <div>Visit Origin</div>
          <div>Support</div>
        </div>
      </div>
    </div>
  )
}

export default Footer
