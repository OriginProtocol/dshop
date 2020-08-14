import React from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useProducts from 'utils/useProducts'
import useRedirect from 'utils/useRedirect'

import { useStateValue } from 'data/state'

import * as Icons from 'components/icons/Admin'

const Onboarding = () => {
  const { config } = useConfig()
  const { shopConfig } = useShopConfig()
  const { products } = useProducts()
  const [{ admin }] = useStateValue()
  const redirectTo = useRedirect()

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
      name: fbt('Connect your crypto wallet', 'admin.Onboarding.connectWallet'),
      note: fbt(
        'You must connect an Ethereum wallet with at least 0.005 ETH in order to publish changes and receive crypto payments.',
        'admin.Onboarding.connectWalletDesc'
      ),
      link: '/admin/settings/payments'
    },
    {
      id: 'verify_email',
      completed: get(admin, 'emailVerified', false),
      icon: <Icons.Email />,
      name: fbt('Verify your email', 'admin.Onboarding.verifyEmail'),
      link: '/admin/settings/users'
    },
    {
      id: 'new_product',
      completed: get(products, 'length', 0) > 0,
      icon: <Icons.Box />,
      name: fbt('Add your first product', 'admin.Onboarding.newProduct'),
      link: '/admin/products/new'
    },
    {
      id: 'setup_shipping',
      completed: get(products, 'length', 0) > 0,
      icon: <Icons.Shipping />,
      name: fbt(
        'Set up your shipping options',
        'admin.Onboarding.setupShipping'
      ),
      link: '/admin/settings/shipping'
    }
  ]

  const taskset2 = [
    {
      id: 'custom_domain',
      completed: !!get(shopConfig, 'domain'),
      icon: <Icons.Globe />,
      name: fbt('Add a custom domain name', 'admin.Onboarding.customDomain'),
      link: '/admin/settings'
    },
    {
      id: 'store_logo',
      completed: !!(config && config.logo) && !!(config && config.favicon),
      icon: <Icons.Photo />,
      name: fbt('Add a store logo and favicon', 'admin.Onboarding.storeLogo'),
      link: '/admin/settings'
    },
    {
      id: 'store_info',
      completed: !!get(shopConfig, 'about'),
      icon: <Icons.Text />,
      name: fbt('Tell us a bit about your store', 'admin.Onboarding.storeInfo'),
      link: '/admin/settings'
    },
    {
      id: 'sm_links',
      completed: hasSocialLinks,
      icon: <Icons.Link />,
      name: fbt('Add social media links', 'admin.Onboarding.smLinks'),
      link: '/admin/settings'
    },
    {
      id: 'payment_options',
      completed: get(config, 'paymentMethods.length', 0) > 1,
      icon: <Icons.Card />,
      name: fbt(
        'Add alternative payment options',
        'admin.Onboarding.paymentOptions'
      ),
      link: '/admin/settings/payments'
    }
  ]

  return (
    <div className="onboarding">
      <div className="new-shop-hero">
        <h1>
          <fbt desc="admin.Onboarding.title">
            Congratulations on your new shop!
          </fbt>
        </h1>
        <div className="desc">
          <fbt desc="admin.Onboarding.desc">
            Discover how Dshop can help you get started building{' '}
            <FbtParam name="lineBreak">{<br />}</FbtParam> your business on the
            decentralized web.
          </fbt>
        </div>
      </div>

      <div className="new-shop-tasks">
        <div className="subtitle">
          <fbt desc="admin.Onboarding.finishSetup">
            Finish setting up your store
          </fbt>
        </div>
        <div className="tasks-lists">
          {taskset1.map((task) => {
            return (
              <div
                className="task-item"
                key={task.id}
                onClick={() => {
                  if (task.link) {
                    redirectTo(task.link)
                  }
                }}
              >
                <div className={task.completed ? ' completed' : ''}>
                  {task.icon}
                  <div className="task-name">{task.name}</div>
                  {task.completed && (
                    <img
                      className="completed-icon"
                      src="images/green-checkmark-circle.svg"
                    />
                  )}
                </div>
                {task.note && !task.completed ? (
                  <div className="note">{task.note}</div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="new-shop-tasks mt-5">
        <div className="subtitle">
          <fbt desc="admin.Onboarding.upAndRunning">
            Get your store up and running
          </fbt>
        </div>
        <div className="tasks-lists">
          {taskset2.map((task) => {
            return (
              <div
                className="task-item"
                key={task.id}
                onClick={() => {
                  if (task.link) {
                    redirectTo(task.link)
                  }
                }}
              >
                <div className={task.completed ? ' completed' : ''}>
                  {task.icon}
                  <div className="task-name">{task.name}</div>
                  {task.completed && (
                    <img
                      className="completed-icon"
                      src="images/green-checkmark-circle.svg"
                    />
                  )}
                </div>
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
          .note
            border-top: 1px solid #ffda26
            background: #fff7d6
            padding: 0.875rem 1.25rem
            border-radius: 0 0 10px 10px
            line-height: normal
            color: #000
          > div:first-child
            padding: 1rem 1.25rem
            display: flex
            min-height: 5rem
            line-height: normal
            align-items: center
            cursor: pointer
            &:hover
              background-color: #f8f8f8
              border-radius: 10px

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
