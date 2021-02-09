import React, { useState } from 'react'
import fbt, { FbtParam } from 'fbt'
import get from 'lodash/get'
import Clipboard from 'components/icons/Clipboard'
import CheckCircle from 'components/icons/CheckCircle'

const Banner = ({ totalTasks, completedTasks, shopDomain }) => {
  const [hideBanner, setHideBanner] = useState(
    Boolean(get(localStorage, 'hideOnboardingBanner', false))
  )
  const [storeLinkCopied, setStoreLinkCopied] = useState(false)

  if (hideBanner) return null

  const allComplete = totalTasks === completedTasks
  const halfComplete = completedTasks > totalTasks / 2

  const ShareActions = ({ clicked }) => {
    if (!clicked) {
      return (
        <button
          className="btn btn-outline-light copy-button"
          onClick={() => {
            navigator.clipboard
              .writeText(`${shopDomain}`)
              .then(() => {
                setStoreLinkCopied(true)
                window.setTimeout(() => {
                  setStoreLinkCopied(false)
                }, 3000)
              })
              .catch((err) => {
                console.log(err)
              })
          }}
        >
          <Clipboard />
        </button>
      )
    } else {
      return (
        <button className="btn btn-outline-light copied-button active">
          <CheckCircle />
        </button>
      )
    }
  }

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

      <div className="desc mt-4">
        <fbt desc="component.onboarding.Banner.shareStoreUrl">
          Share the link to your store:
        </fbt>
        <span className="share-link">
          {`${shopDomain}`}
          <ShareActions clicked={storeLinkCopied} />
        </span>
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

      .share-link
        font-weight: bold
        margin-left: 0.2rem

      ShareActions
        margin-left: 0.2rem

        .bi.bi-clipboard
          overflow: visible
          height: 1.6rem
          width: 1.5rem
          path
            stroke: #e0efff
            stroke-width: 0.5
          &:hover
            cursor: pointer

        .icon.icon-check-circle
          overflow: visible
          height: 1.6rem
          fill: #54d693
          path
            stroke: #e0efff
            stroke-width: 4

    .dismiss-button
      cursor: pointer
      position: absolute
      top: 18px
      right: 18px
      color: #e0efff
      font-size: 1.125rem
      padding: 0.125rem
`)
