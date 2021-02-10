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

  /**
   * ShareActions: Displays a 'Copy to Clipboard' button on the Banner. If the user clicks on the button, the store link is copied
   * to the clipboard, and the button turns into a checkmark to indicate success.
   * @prop clicked: <boolean> should be true if the user clicks the 'Copy to Clipboard' button
   * 
   * Button and Tooltip references: 
   *  https://getbootstrap.com/docs/5.0/components/buttons/
   *  https://getbootstrap.com/docs/5.0/components/tooltips/
   *
   * Clipboard reference:
   *  https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
   */
  const ShareActions = ({ clicked }) => {
    if (!clicked) {
      return (
        <button
          className="btn btn-outline-light btn-sm copy-button"
          data-bs-toggle="tooltip"
          data-bs-placement="right"
          title="Copy to Clipboard"
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
        <span
          tabIndex="0"
          data-bs-toggle="tooltip"
          data-bs-placement="right"
          title="Copied!"
        >
          <CheckCircle />
        </span>
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

      {halfComplete ? (
        <div className="desc mt-4">
          <fbt desc="component.onboarding.Banner.storeUrl">Store URL:</fbt>
          <span className="share-link">
            {`${shopDomain}`}
            <ShareActions clicked={storeLinkCopied} />
          </span>
        </div>
      ) : null}

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

      .copy-button
        margin-left: 0.3rem
        padding-top: 0.1rem
        padding-bottom: 0.4rem
        padding-left: 0.3rem
        padding-right: 0.3rem
        .bi.bi-clipboard
          overflow: visible
          path
            stroke: #e0efff
            stroke-width: 0.2

      .icon.icon-check-circle
        margin-left: 0.5rem
        overflow: visible
        height: 1.5rem
        fill: #54d693
        path
          stroke: #fff
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
