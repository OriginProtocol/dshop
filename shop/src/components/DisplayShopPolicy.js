import React from 'react'
import fbt from 'fbt'

import Link from 'components/Link'

const DisplayPolicy = ({ heading, text }) => {
  return (
    <>
      <div className="collection">
        <div className="breadcrumbs">
          <Link to="/" className="linkToHome">
            <fbt desc="Home">Home</fbt>
          </Link>
          <span>{heading}</span>
        </div>
        <div className="d-flex flex-row justify-content-between align-items-center">
          <h3>{heading}</h3>
        </div>
      </div>
      <div className="policy-text">
        {!text ? null : <div dangerouslySetInnerHTML={{ __html: text }} />}
      </div>
    </>
  )
}

export default DisplayPolicy

require('react-styl')(`
  .policy-text
    max-width: 700px
    a
      text-decoration: underline
    h1
      font-size: 24px
    h2
      font-size: 18px
`)
