import React, { useState, useEffect } from 'react'

import Link from 'components/Link'
import useConfig from 'utils/useConfig'

const About = () => {
  const { config } = useConfig()
  const [loading, setLoading] = useState(config.about ? true : false)
  const [about, setAbout] = useState()

  useEffect(() => {
    if (config.about) {
      setLoading(true)
      fetch(`${config.dataSrc}${config.about}`)
        .then((res) => {
          setLoading(false)
          if (res.ok) {
            res.text().then((body) => setAbout(body))
          }
        })
        .catch((err) => {
          console.error('Failed to load about page', err)
          setLoading(false)
        })
    }
  }, [config.about])

  if (loading) {
    return null
  }

  return (
    <>
      <div className="collection">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <span>About</span>
        </div>
        <div className="d-flex flex-row justify-content-between align-items-center">
          <h3>About</h3>
        </div>
      </div>
      <div className="about-page">
        {about ? (
          <div dangerouslySetInnerHTML={{ __html: about }} />
        ) : (
          <>
            <div className="question">What is this site?</div>
            <div className="answer">
              This is a decentralized e-commerce site leveraging Ethereum, IPFS
              and PGP. All content is hosted on IPFS. Payments can be made with
              ETH, ERC-20 tokens or Credit Card.
            </div>
            <div className="question">Who built this?</div>
            <div className="answer">
              This site was built by{' '}
              <a href="https://www.originprotocol.com">Origin Protocol</a>,
              whose mission it is to bring about decentralized, peer to peer
              marketplaces. It is 100% open source and available on{' '}
              <a href="https://github.com/OriginProtocol/dshop">GitHub</a>.
            </div>
            <div className="question">
              How do I deploy my own decentralized e-commerce store?
            </div>
            <div className="answer">
              {'Visit '}
              <a href="https://dshop.originprotocol.com">
                https://dshop.originprotocol.com
              </a>
              {' to setup your own store.'}
            </div>
            <div className="question">What is your support email address?</div>
            <div className="answer">
              {`Please email `}
              <a href={`mailto:${config.supportEmailPlain}`}>
                {config.supportEmailPlain}
              </a>
              {' for support.'}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default About

require('react-styl')(`
  .about-page
    max-width: 600px
    a
      text-decoration: underline
    .question
      font-weight: bold
    .answer
      margin-bottom: 1rem
`)
