import React from 'react'
import fbt from 'fbt'

const ProcessorsList = ({ processors }) => {
  return (
    <div className="processors-list">
      {processors.map((processor) => (
        <div key={processor.id} className={`processor ${processor.id}`}>
          <div className="icon">{processor.icon}</div>
          <div>
            <div className="title">{processor.title}</div>
            <div className="description">
              {processor.description}
              {!processor.enabled ? null : (
                <div className="connected-text">
                  <fbt desc="connected">Connected</fbt>
                </div>
              )}
            </div>
            <div className="actions">{processor.actions}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProcessorsList

require('react-styl')(`
  .processors-list
    .processor
      margin-bottom: 2rem
      display: flex
      .icon
        display: flex
        align-items: center
        justify-content: center
        width: 115px
        height: 115px
        border-radius: 10px
        margin-right: 1.5rem
      &.stripe .icon
        background-color: #6772e5
      &.uphold .icon
        background-color: #00cc58
      &.web3 .icon
        background-color: #3b80ee
      &.printful .icon, &.sendgrid .icon, &.aws .icon, &.mailgun .icon, &.paypal .icon
        border: 1px solid #cdd7e0

      > div:nth-child(2)
        display: flex
        flex-direction: column
        line-height: normal
        .title
          font-weight: bold
        .description
          max-width: 30rem
          flex: 1
          margin: 0.5rem 0
          .connected-text
            margin-top: 0.5rem
            display: flex
            align-items: center
            &:before
              content: ' '
              width: 14px
              height: 14px
              background-color: #3beec3
              border-radius: 50%
              display: inline-block
              margin-right: 6px
        .actions
          margin-top: 0.25rem
`)
