import React from 'react'
import { useHistory } from 'react-router-dom'

import useConfig from 'utils/useConfig'
import useProducts from 'utils/useProducts'

const AdminHome = () => {
  const { config } = useConfig()
  const { products } = useProducts()
  const history = useHistory()

  const tasks = [
    {
      id: 'new_product',
      completed: products.length ? true : false,
      icon: '/images/new-shop/box.svg',
      name: 'Add your first product',
      link: '/admin/products/new'
    },
    {
      id: 'custom_domain',
      completed: false,
      icon: '/images/new-shop/globe.svg',
      name: 'Add a custom domain name',
      link: '/admin/settings'
    },
    {
      id: 'store_logo',
      completed: config.logo ? true : false,
      icon: '/images/new-shop/photo.svg',
      name: 'Add a store logo and favicon',
      link: '/admin/settings'
    },
    {
      id: 'store_info',
      completed: false,
      icon: '/images/new-shop/text.svg',
      name: 'Tell us a bit about your store',
      link: '/admin/settings'
    },
    {
      id: 'sm_links',
      completed: false,
      icon: '/images/new-shop/link.svg',
      name: 'Add social media links',
      link: '/admin/settings'
    }
  ]
  return (
    <div className="admin-home">
      <div className="new-shop-hero">
        <h1>Congratulations on your new shop!</h1>
        <div className="desc">
          Discover how Dshop can help you get started building
          <br /> your business on the decentralized web.
        </div>
      </div>

      <div className="new-shop-tasks">
        <div className="subtitle">Get your store up and running</div>
        <div className="tasks-lists">
          {tasks.map((task) => {
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
                <img className="task-icon" src={task.icon} />
                <div className="task-name">{task.name}</div>
                {task.completed && (
                  <img
                    className="completed-icon"
                    src="/images/green-checkmark-circle.svg"
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

export default AdminHome

require('react-styl')(`
  .admin-home
    .new-shop-hero
      margin: -1.875rem -2.5rem 1.875rem -2.5rem
      background-image: url('/images/background-graphic.svg')
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

          .task-icon
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

`)
