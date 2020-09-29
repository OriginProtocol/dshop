import React from 'react'
import get from 'lodash/get'

import useAbout from 'utils/useAbout'
import useConfig from 'utils/useConfig'

const About = () => {
  const { config } = useConfig()
  const { about } = useAbout()
  const src = `${config.dataSrc}${get(config, 'theme.home.aboutImage')}`

  if (!about) {
    return <div className="min-h-screen" />
  }

  return (
    <>
      <div className="container my-12 sm:my-24">
        <div className="text-3xl sm:text-5xl leading-none mb-6">About</div>
        {!about ? null : (
          <div
            className="text-xl sm:text-3xl whitespace-pre-line leading-tight max-w-4xl"
            dangerouslySetInnerHTML={{ __html: about }}
          />
        )}
      </div>
      <div
        className="bg-no-repeat mb-12"
        style={{
          paddingTop: '45%',
          backgroundSize: '200%',
          backgroundPosition: '39% 56%',
          backgroundImage: `url(${src})`
        }}
      />
    </>
  )
}

export default About
