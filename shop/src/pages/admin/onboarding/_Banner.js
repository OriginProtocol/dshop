import React, { useState } from 'react'
import fbt, { FbtParam } from 'fbt'
import get from 'lodash/get'

const Banner = ({ totalTasks, completedTasks }) => {
  const [hideBanner, setHideBanner] = useState(
    Boolean(get(localStorage, 'hideOnboardingBanner', false))
  )

  if (hideBanner) return null

  const allComplete = totalTasks === completedTasks
  const halfComplete = completedTasks > totalTasks / 2

  return (
    <div className="onboarding-banner">
      <h1>
        {allComplete ? (
          <fbt desc="component.onboarding.Banner.completeTitle">
            Your store is looking great!
          </fbt>
        ) : halfComplete ? (
          <fbt desc="component.onboarding.Banner.halfCompleteTitle">
            Let’s pick up where you left off
          </fbt>
        ) : (
          <fbt desc="component.onboarding.Banner.title">
            Congratulations on your new shop!
          </fbt>
        )}
      </h1>
      <div className="desc">
        {allComplete ? (
          <fbt desc="component.onboarding.Banner.completeDesc">
            Congratulations! You’re done setting up your Dshop.{' '}
            <FbtParam name="lineBreak">{<br />}</FbtParam>Now all you need are
            some customers :)
          </fbt>
        ) : halfComplete ? (
          <fbt desc="component.onboarding.Banner.halfCompleteDesc">
            You’re getting closer to having your own decentralized{' '}
            <FbtParam name="lineBreak">{<br />}</FbtParam>e-commerce store! Just
            a few more steps…
          </fbt>
        ) : (
          <fbt desc="component.onboarding.Banner.desc">
            Discover how Dshop can help you get started building{' '}
            <FbtParam name="lineBreak">{<br />}</FbtParam> your business on the
            decentralized web.
          </fbt>
        )}
      </div>

      <div className="desc mt-4">
        <fbt desc="component.onboarding.Banner.needHelp">
          Need help with your store? Reach out to{' '}
          <a href="mailto:dshop@originprotocol.com">Dshop support &raquo;</a>
        </fbt>
      </div>

      <div
        className="dismiss-button"
        onClick={() => {
          localStorage.hideOnboardingBanner = true
          setHideBanner(true)
        }}
      >
        &times;
      </div>
    </div>
  )
}

export default Banner

require('react-styl')(`
  .onboarding-banner
    background-image: url('images/onboarding-banner-bg.svg')
    background-size: cover
    background-position: center
    background-repeat: no-repeat
    text-align: left
    padding: 0 1.875rem 0 1.875rem
    margin-bottom: 2.5rem
    border-radius: 10px
    height: 250px
    display: flex
    flex-direction: column
    justify-content: center
    position: relative

    h1
      font-size: 1.5rem;
      font-weight: bold;
      color: #ffffff;

    .desc
      color: #e0efff
      a
        font-weight: bold
        color: #e0efff
        &:hover
          color: #fff

    .dismiss-button
      cursor: pointer
      position: absolute
      top: 18px
      right: 18px
      color: #e0efff
      font-size: 1.125rem
      padding: 0.125rem
`)
