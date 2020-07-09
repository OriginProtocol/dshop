import React from 'react'
import { useHistory } from 'react-router-dom'

import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useProducts from 'utils/useProducts'

import { useStateValue } from 'data/state'

import * as Icons from 'components/icons/Admin'

const Onboarding = () => {
  const { config } = useConfig()
  const { shopConfig } = useShopConfig()
  const { products } = useProducts()
  const [{ admin }] = useStateValue()
  const history = useHistory()

  const hasSocialLinks = !!(
    config &&
    (config.facebook ||
      config.twitter ||
      config.instagram ||
      config.medium ||
      config.youtube)
  )

  const web3Enabled = !!get(config, 'listingId')

  const taskset1 = [
    {
      id: 'setup_web3',
      completed: web3Enabled,
      icon: <Icons.Wallet />,
      name: 'Setup a Web3 wallet',
      link: '/admin/settings/payments'
    },
    {
      id: 'payment_options',
      completed:
        get(config, 'paymentMethods.length', 0) > (web3Enabled ? 1 : 0),
      icon: <Icons.Card />,
      name: 'Set up your payment options',
      link: '/admin/settings/payments'
    },
    {
      id: 'verify_email',
      completed: get(admin, 'emailVerified', false),
      icon: <Icons.Email />,
      name: 'Verify your email',
      link: '/admin/settings/users'
    },
    {
      id: 'new_product',
      completed: get(products, 'length', 0) > 0,
      icon: <Icons.Box />,
      name: 'Add your first product',
      link: '/admin/products/new'
    }
  ]

  const taskset2 = [
    {
      id: 'custom_domain',
      completed: !!get(shopConfig, 'domain'),
      icon: <Icons.Globe />,
      name: 'Add a custom domain name',
      link: '/admin/settings'
    },
    {
      id: 'store_logo',
      completed: !!(config && config.logo) && !!(config && config.favicon),
      icon: <Icons.Photo />,
      name: 'Add a store logo and favicon',
      link: '/admin/settings'
    },
    {
      id: 'store_info',
      completed: !!get(shopConfig, 'about'),
      icon: <Icons.Text />,
      name: 'Tell us a bit about your store',
      link: '/admin/settings'
    },
    {
      id: 'sm_links',
      completed: hasSocialLinks,
      icon: <Icons.Link />,
      name: 'Add social media links',
      link: '/admin/settings'
    }
  ]

  return (
    <div className="onboarding">
      <div className="new-shop-hero">
        <h1>Congratulations on your new shop!</h1>
        <div className="desc">
          Discover how Dshop can help you get started building
          <br /> your business on the decentralized web.
        </div>
      </div>

      <div className="new-shop-tasks">
        <div className="subtitle">Finish setting up your store</div>
        <div className="tasks-lists">
          {taskset1.map((task) => {
            return (
              <div
                className={`task-item${task.completed ? ' completed' : ''}`}
                key={task.id}
                onClick={() => {
                  if (task.link) {
                    history.push({
                      pathname: task.link,
                      state: { scrollToTop: true }
                    })
                  }
                }}
              >
                {task.icon}
                <div className="task-name">{task.name}</div>
                {task.completed && (
                  <img
                    className="completed-icon"
                    src="images/green-checkmark-circle.svg"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="new-shop-tasks mt-5">
        <div className="subtitle">Get your store up and running</div>
        <div className="tasks-lists">
          {taskset2.map((task) => {
            return (
              <div
                className={`task-item${task.completed ? ' completed' : ''}`}
                key={task.id}
                onClick={() => {
                  if (task.link) {
                    history.push({
                      pathname: task.link,
                      state: { scrollToTop: true }
                    })
                  }
                }}
              >
                {task.icon}
                <div className="task-name">{task.name}</div>
                {task.completed && (
                  <img
                    className="completed-icon"
                    src="images/green-checkmark-circle.svg"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Onboarding

require('react-styl')(`
  .onboarding
    .new-shop-hero
      margin: -1.875rem -2.5rem 1.875rem -2.5rem
      background-image: url('images/background-graphic.svg')
      background-size: cover
      background-position: center
      background-repeat: no-repeat
      text-align: center

      padding: 4.5rem 0 5.5rem 0

      h1
        font-size: 1.5rem;
        font-weight: bold;
        color: #ffffff;

      .desc
        color: #e0efff

    .new-shop-tasks
      max-width: 650px
      margin: 0 auto
      .subtitle
        font-size: 1rem
        font-weight: bold
        color: #000000
        margin-bottom: 1rem
      .tasks-lists
        .task-item
          margin-bottom: 0.5rem
          border-radius: 10px
          border: solid 1px #cdd7e0
          background-color: #fafbfc
          padding: 1rem 1.25rem
          display: flex
          min-height: 4.5rem
          line-height: normal
          align-items: center
          cursor: pointer

          .task-name
            flex: 1
            font-size: 1.25rem
            padding-bottom: 2px

          .icon
            margin-right: 1.5rem

          .completed-icon
            height: 34px
            width: 34px
            object-fit: contain

          &.completed
            .task-name
              color: #8293a4
            .icon
              path
                fill: #8493A3 !important

`)
