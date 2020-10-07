import React from 'react'

import useAbout from 'utils/useAbout'

const About = () => {
  const { about } = useAbout()

  return (
    <>
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
            <img className="w-full" src="peer-art/artist.png" />
          </div>
        </div>
      </div>
    </>
  )
}

export default About
