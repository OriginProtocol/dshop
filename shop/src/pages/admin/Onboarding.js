import React from 'react'
import { useHistory } from 'react-router-dom'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useProducts from 'utils/useProducts'

import * as Icons from 'components/icons/Admin'

const Onboarding = () => {
  const { config } = useConfig()
  const { shopConfig } = useShopConfig()
  const { products } = useProducts()
  const history = useHistory()

  const hasSocialLinks = !!(
    config &&
    (config.facebook ||
      config.twitter ||
      config.instagram ||
      config.medium ||
      config.youtube)
  )

  const taskset1 = [
    {
      id: 'new_product',
      completed: !!(products && products.length > 0),
      icon: <Icons.Box />,
      name: 'Add your first product',
      link: '/admin/products/new'
    }
  ]

  const taskset2 = [
    {
      id: 'custom_domain',
      completed: !!(shopConfig && shopConfig.domain),
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
      completed: !!(shopConfig && shopConfig.aboutStore),
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

      <div className="new-shop-tasks">
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
          padding: 1rem
          display: flex
          align-items: center
          cursor: pointer

          .task-name
            flex: 1
            font-size: 1.125rem

          .icon
            height: 48px
            width: 48px
            object-fit: contain
            margin-right: 1rem

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
