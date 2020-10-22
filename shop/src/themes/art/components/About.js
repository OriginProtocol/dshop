import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

const About = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const relPath = get(themeVars, 'about.aboutImage.0.url')
  const src = `${config.dataSrc}${relPath}`
  const aboutText = get(themeVars, 'about.aboutText')

  return (
    <div className="container mt-12">
      <div className="text-4xl leading-none font-medium">About</div>
      <div className="flex mt-16">
        <div style={{ flex: '3' }}>
          {!aboutText ? null : (
            <div className="text-sm mr-32 whitespace-pre-line">{aboutText}</div>
          )}
        </div>
        {!relPath ? null : (
          <div style={{ flex: '2' }}>
            <div
              className="bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${src})`,
                paddingTop: '126%'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default About
