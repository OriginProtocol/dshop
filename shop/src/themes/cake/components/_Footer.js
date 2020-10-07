import React from 'react'
import get from 'lodash/get'
import useConfig from 'utils/useConfig'
import SocialLinks from 'components/SocialLinks'

const Footer = () => {
  const { config } = useConfig()
  const logoUrl = get(config, 'theme.logoUrl')
  return (
    <div className="text-center">
      <div className="border-t mt-24" />

      <div className="container pt-16 pb-16 sm:pb-48">
        <div className="text-center mb-10">
          <img className="mx-auto" style={{ width: 120 }} src={logoUrl} />
        </div>
        <div className="mb-10">
          <SocialLinks />
        </div>
        <div>
          <ul className="flex flex-col sm:flex-row text-red-500 justify-center">
            <li className="pb-4 sm:mr-10">
              <a href="#">FAQ</a>
            </li>
            <li className="pb-4 sm:mr-10">
              <a href="#">About Dshop</a>
            </li>
            <li className="pb-4 sm:mr-10">
              <a href="#">Visit Origin</a>
            </li>
            <li className="pb-4">
              <a href="#">Support</a>
            </li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row pb-8 sm:pb-0 text-red-500 justify-center">
          <div className="mr-10">Powered by Origin Dshop</div>
          <div>© 2020 Origin Protocol</div>
        </div>
      </div>
    </div>
  )
}

export default Footer
