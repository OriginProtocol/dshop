import React, { useState, useEffect } from 'react'
import fbt from 'fbt'

import Link from 'components/Link'
import useConfig from 'utils/useConfig'

const About = () => {
  const { config } = useConfig()
  const [loading, setLoading] = useState(config.about ? true : false)
  const [terms, setTerms] = useState()
  useEffect(() => {
    if (config.terms) {
      setLoading(true)
      fetch(`${config.dataSrc}${config.terms}`).then((res) => {
        setLoading(false)
        if (res.ok) {
          res.text().then((body) => setTerms(body))
        }
      })
    }
  }, [config.terms])

  if (loading) {
    return null
  }

  return (
    <>
      <div className="collection">
        <div className="breadcrumbs">
          <Link to="/">
            <fbt desc="Home">Home</fbt>
          </Link>
          <span>
            <fbt desc="Terms">Terms</fbt>
          </span>
        </div>
        <div className="d-flex flex-row justify-content-between align-items-center">
          <h3>
            <fbt desc="Terms">Terms</fbt>
          </h3>
        </div>
      </div>
      <div className="terms-and-conditions">
        {!terms ? null : <div dangerouslySetInnerHTML={{ __html: terms }} />}
      </div>
    </>
  )
}

export default About

require('react-styl')(`
  .terms-and-conditions
    max-width: 700px
    a
      text-decoration: underline
    h1
      font-size: 24px
    h2
      font-size: 18px
`)
