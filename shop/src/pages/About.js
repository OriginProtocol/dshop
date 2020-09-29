import React from 'react'
import fbt, { FbtParam } from 'fbt'
import Link from 'components/Link'

import useAbout from 'utils/useAbout'
import useConfig from 'utils/useConfig'

const About = () => {
  const { config } = useConfig()
  const { loading, about } = useAbout()
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
            <fbt desc="About">About</fbt>
          </span>
        </div>
        <div className="d-flex flex-row justify-content-between align-items-center">
          <h3>
            <fbt desc="About">About</fbt>
          </h3>
        </div>
      </div>
      <div className="about-page">
        {about ? (
          <div dangerouslySetInnerHTML={{ __html: about }} />
        ) : (
          <>
            <div className="question">
              <fbt desc="about.whatIsThisSite">What is this site?</fbt>
            </div>
            <div className="answer">
              <fbt desc="about.aboutSite">
                This is a decentralized e-commerce site leveraging Ethereum,
                IPFS and PGP. All content is hosted on IPFS. Payments can be
                made with ETH, ERC-20 tokens or Credit Card.
              </fbt>
            </div>
            <div className="question">
              <fbt desc="about.whoBuiltThis">Who built this?</fbt>
            </div>
            <div className="answer">
              <fbt desc="about.builtBy">
                This site was built by{' '}
                <FbtParam name="about.originLink">
                  <a href="https://www.originprotocol.com">Origin Protocol</a>
                </FbtParam>, whose mission it is to bring about decentralized,
                peer to peer marketplaces. It is 100% open source and available
                on{' '}
                <FbtParam name="about.githubLink">
                  <a href="https://github.com/OriginProtocol/dshop">GitHub</a>
                </FbtParam>.
              </fbt>
              This site was built by{' '}
              <a href="https://www.originprotocol.com">Origin Protocol</a>,
              whose mission it is to bring about decentralized, peer to peer
              marketplaces. It is 100% open source and available on{' '}
              <a href="https://github.com/OriginProtocol/dshop">GitHub</a>.
            </div>
            <div className="question">
              <fbt desc="about.howToDeploy">
                How do I deploy my own decentralized e-commerce store?
              </fbt>
            </div>
            <div className="answer">
              <fbt desc="about.dshopLink">
                Visit{' '}
                <FbtParam name="email">
                  <a href="https://dshop.originprotocol.com">
                    https://dshop.originprotocol.com
                  </a>
                </FbtParam>{' '}
                to setup your own store.
              </fbt>
            </div>
            <div className="question">What is your support email address?</div>
            <div className="answer">
              <fbt desc="about.emailSupport">
                Please email{' '}
                <FbtParam name="emailLink">
                  <a href={`mailto:${config.supportEmailPlain}`}>
                    {config.supportEmailPlain}
                  </a>
                </FbtParam>{' '}
                for support.
              </fbt>
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
