import React from 'react'
import get from 'lodash/get'

import useAbout from 'utils/useAbout'
import useConfig from 'utils/useConfig'

const About = () => {
  const { config } = useConfig()
  const { about } = useAbout()
  const src = `${config.dataSrc}${get(config, 'theme.home.aboutImage')}`

  return (
    <div className="container mt-12">
      <div className="text-4xl leading-none font-medium">About</div>
      <div className="flex mt-16">
        <div style={{ flex: '3' }}>
          {!about ? null : (
            <div
              className="text-sm mr-32"
              dangerouslySetInnerHTML={{ __html: about }}
            />
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
