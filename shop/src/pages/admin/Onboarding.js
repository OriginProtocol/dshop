import React, { useState } from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useProducts from 'utils/useProducts'

import { useStateValue } from 'data/state'

import * as Icons from 'components/icons/Admin'
import TaskItem from 'components/onboarding/TaskItem'
import ArticleItem from 'components/onboarding/ArticleItem'
import Banner from 'components/onboarding/Banner'

import Web3Modal from 'pages/admin/settings/payments/Web3Modal'

const Onboarding = () => {
  const { config } = useConfig()
  const { products } = useProducts()
  const [{ admin }] = useStateValue()

  const [showWeb3Modal, setShowModal] = useState(false)

  const hasSocialLinks = !!(
    config &&
    (config.facebook ||
      config.twitter ||
      config.instagram ||
      config.medium ||
      config.youtube)
  )

  const web3Enabled = !!get(config, 'listingId')

  const taskset = [
    {
      id: 'setup_web3',
      completed: web3Enabled,
      icon: <Icons.Wallet />,
      name: fbt('Connect your crypto wallet', 'admin.Onboarding.connectWallet'),
      desc: fbt(
        'You must connect an Ethereum wallet with at least 0.005 ETH in order to publish changes and receive crypto payments.',
        'admin.Onboarding.connectWalletDesc'
      ),
      onClick: () => {
        if (web3Enabled) {
          // Skip if already enabled
          return
        }

        setShowModal(true)
      }
    },
    {
      id: 'verify_email',
      completed: get(admin, 'emailVerified', false),
      icon: <Icons.Email />,
      name: fbt('Verify your email', 'admin.Onboarding.verifyEmail'),
      // TODO: Replace placeholder text
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam efficitur condimentum euismod. Morbi at varius diam.',
      link: '/admin/settings/users'
    },
    {
      id: 'new_product',
      completed: get(products, 'length', 0) > 0,
      icon: <Icons.Box />,
      name: fbt('Add your first product', 'admin.Onboarding.newProduct'),
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam efficitur condimentum euismod. Morbi at varius diam.',
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
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam efficitur condimentum euismod. Morbi at varius diam.',
      link: '/admin/settings/shipping'
    },
    {
      id: 'customize_store',
      completed:
        hasSocialLinks ||
        !!(config && config.logo) ||
        !!(config && config.favicon),
      icon: <Icons.Globe />,
      name: fbt('Customize your store', 'admin.Onboarding.customizeStore'),
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam efficitur condimentum euismod. Morbi at varius diam.',
      link: '/admin/settings'
    },
    {
      id: 'payment_options',
      completed: get(config, 'paymentMethods.length', 0) > 1,
      icon: <Icons.Card />,
      name: fbt(
        'Set up other payment options',
        'admin.Onboarding.paymentOptions'
      ),
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam efficitur condimentum euismod. Morbi at varius diam.',
      link: '/admin/settings/payments'
    }
  ]

  const articles = [
    // {
    //   title: 'Article name here',
    //   summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam efficitur condimentum euismod. Morbi at varius diam...',
    //   link: 'https://originprotocol.com/'
    // }
  ]

  return (
    <div className="onboarding">
      <Banner
        totalTasks={taskset.length}
        completedTasks={taskset.filter((t) => t.completed).length}
      />

      <div className="new-shop-tasks">
        <div className="subtitle">
          <fbt desc="admin.Onboarding.finishSetup">
            Finish setting up your store
          </fbt>
        </div>
        <div className="tasks-lists">
          {taskset.map((task) => (
            <TaskItem task={task} key={task.id} />
          ))}
        </div>
      </div>

      {!articles.length ? null : (
        <div className="new-shop-tasks mt-5">
          <div className="subtitle">
            <fbt desc="admin.Onboarding.getUpToSpeed">
              Get up to speed on your Dshop
            </fbt>
          </div>
          <div className="tasks-lists">
            {articles.map((article, index) => (
              <ArticleItem article={article} key={index} />
            ))}
          </div>
        </div>
      )}

      {!showWeb3Modal ? null : (
        <Web3Modal onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

export default Onboarding

require('react-styl')(`
  .onboarding
    .new-shop-tasks
      margin: 0 auto
      width: 100%
      .subtitle
        font-size: 1rem
        font-weight: bold
        color: #000000
        margin-bottom: 1rem
      .tasks-lists
        width: 100%
        display: grid
        grid-template-columns: 50% 50%

`)
