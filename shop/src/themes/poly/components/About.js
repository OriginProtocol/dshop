import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

const About = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const relativePath = get(themeVars, 'about.aboutImage.0.url')
  const src = !relativePath ? null : `${config.dataSrc}${relativePath}`
  const aboutText = get(themeVars, 'about.aboutText')

  if (!aboutText) {
    return <div className="min-h-screen" />
  }

  return (
    <>
      <div className="container my-12 sm:my-24">
        <div className="text-3xl sm:text-5xl leading-none mb-6">About</div>
        <div className="text-xl sm:text-3xl whitespace-pre-line leading-tight max-w-4xl">
          {aboutText}
        </div>
      </div>
      <div
        className="bg-no-repeat mb-12"
        style={{
          paddingTop: '47%',
          backgroundSize: '100%',
          backgroundPosition: 'center',
          backgroundImage: src ? `url(${src})` : undefined
        }}
      />
    </>
  )
}

export default About
