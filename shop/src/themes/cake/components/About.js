import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

const About = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const relativePath = get(themeVars, 'about.aboutImage.0.url')
  const src = `${config.dataSrc}${relativePath}`
  const aboutText = get(themeVars, 'about.aboutText')

  return (
    <>
      <div className="container mt-12">
        <div className="text-4xl leading-none font-header">About</div>
        <div className="my-8">
          {!aboutText ? null : (
            <div className="whitespace-pre-line" children={aboutText} />
          )}
        </div>
        {!relativePath ? null : (
          <div>
            <img className="w-full" src={src} />
          </div>
        )}
      </div>
    </>
  )
}

export default About
