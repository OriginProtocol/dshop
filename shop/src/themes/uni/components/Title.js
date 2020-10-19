import React from 'react'

import BackLink from './BackLink'

const Title = ({ children, back }) => {
  return (
    <div
      className="grid mb-4 w-full items-center"
      style={{ gridTemplateColumns: back ? '1fr auto 1fr' : '' }}
    >
      {back ? <BackLink to={back} /> : null}
      <div className="font-bold text-xl text-center">{children}</div>
    </div>
  )
}

export default Title
