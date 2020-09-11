import React from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useProducts from 'utils/useProducts'

import { useStateValue } from 'data/state'

import * as Icons from 'components/icons/Admin'
import TaskItem from './_TaskItem'
import ArticleItem from './_ArticleItem'
import Banner from './_Banner'

const Onboarding = () => {
  const { config } = useConfig()
  const { products } = useProducts()
  const { shopConfig } = useShopConfig()
  const [{ admin }] = useStateValue()

  const hasSocialLinks = !!(
    config &&
    (config.facebook ||
      config.twitter ||
      config.instagram ||
      config.medium ||
      config.youtube)
  )

  const taskset = [
    {
      id: 'connect_wallet',
      completed: get(config, 'walletAddress'),
      icon: <Icons.Wallet />,
      name: fbt('Connect your crypto wallet', 'admin.Onboarding.connectWallet'),
      desc: fbt(
        'Connect an Ethereum wallet in order to receive crypto payments.',
        'admin.Onboarding.connectWalletDesc'
      ),
      link: '/admin/settings/payments'
    },
    {
      id: 'verify_email',
      completed: get(admin, 'emailVerified', false),
      icon: <Icons.Email />,
      name: fbt('Verify your email', 'admin.Onboarding.verifyEmail'),
      // TODO: Replace placeholder text
      desc: fbt(
        'Please verify your email address to ensure you are able to receive notifications of new orders on your store.',
        'admin.Onboarding.newProductDesc'
      ),
      link: '/admin/settings/users'
    },
    {
      id: 'new_product',
      completed: get(products, 'length', 0) > 0,
      icon: <Icons.Box />,
      name: fbt('Add your first product', 'admin.Onboarding.newProduct'),
      desc: fbt(
        'Start building out your store by adding descriptions and images of products for sale.',
        'admin.Onboarding.newProductDesc'
      ),
      link: '/admin/products/new'
    },
    {
      id: 'setup_shipping',
      completed:
        get(products, 'length', 0) > 0 || !!get(shopConfig, 'printful'),
      icon: <Icons.Shipping />,
      name: fbt(
        'Set up your shipping options',
        'admin.Onboarding.setupShipping'
      ),
      desc: fbt(
        'Specify the regions your products ship to, pricing and estimated delivery times.',
        'admin.Onboarding.setupShippingDesc'
      ),
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
      desc: fbt(
        'Change the name, logo and appearance of your store.',
        'admin.Onboarding.customizeStoreDesc'
      ),
      link: '/admin/settings'
    },
    {
      id: 'payment_options',
      completed: get(config, 'paymentMethods.length', 0) > 1,
      icon: <Icons.Card />,
      name: fbt('Set up payment options', 'admin.Onboarding.paymentOptions'),
      desc: fbt(
        "Choose how you'd like to be paid, from crypto currency to credit cards",
        'admin.Onboarding.paymentOptionsDesc'
      ),
      link: '/admin/settings/payments'
    }
  ]

  const articles = [
    // Sample entry
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
        column-gap: 1.5rem
        row-gap: 1.25rem
        grid-template-columns: 1fr 1fr
`)
