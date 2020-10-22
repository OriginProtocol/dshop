import React from 'react'
import get from 'lodash/get'
import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'
import SocialLinks from 'components/SocialLinks'
import usePalette from '../hoc/usePalette'

const Footer = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const relativeLogoPath = get(themeVars, 'header.logo.0.url')
  const logoUrl = `${config.dataSrc}${relativeLogoPath}`

  const palette = usePalette()

  return (
    <div className={`text-center bg-${palette.colors.footerBg}`}>
      <div className="border-t mt-24" />

      <div className="container pt-16 pb-16 sm:pb-48">
        <div className="text-center text-xl font-bold mb-10">
          {relativeLogoPath ? (
            <img className="mx-auto" style={{ width: 120 }} src={logoUrl} />
          ) : (
            config.title
          )}
        </div>
        <div className="mb-10">
          <SocialLinks
            className={`social ${palette.colors.linkColor}`}
            svg={{ className: 'inline-block mx-3', height: 24 }}
          />
        </div>
        <div>
          <ul
            className={`flex flex-col sm:flex-row text-red-500 justify-center font-${palette.colors.linkColor}`}
          >
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
        <div
          className={`flex flex-col sm:flex-row pb-8 sm:pb-0 justify-center ${palette.colors.textColor2}`}
        >
          <div className="mr-10">Powered by Origin Dshop</div>
          <div>© 2020 Origin Protocol</div>
        </div>
      </div>
    </div>
  )
}

export default Footer
