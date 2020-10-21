import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

const About = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const src = `${config.dataSrc}${get(themeVars, 'about.aboutImage.0.url')}`
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
        <div style={{ flex: '2' }}>
          <img className="w-full" src={src} />
        </div>
      </div>
    </div>
  )
}

export default About
