import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'
import usePalette from '../hoc/usePalette'
const About = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const src = `${config.dataSrc}${get(themeVars, 'about.aboutImage.0.url')}`
  const aboutText = get(themeVars, 'about.aboutText')
  const { fonts } = usePalette()

  return (
    <>
      <div className="container mt-12">
        <div className={`text-4xl leading-none font-${fonts.header}`}>
          About
        </div>
        <div className="my-8">
          {!aboutText ? null : (
            <div className="whitespace-pre-line" children={aboutText} />
          )}
        </div>
        <div>
          <img className="w-full" src={src} />
        </div>
      </div>
    </>
  )
}

export default About
