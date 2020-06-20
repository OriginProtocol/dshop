import React, { useEffect, useMemo } from 'react'

import ethers from 'ethers'

import useShopConfig from 'utils/useShopConfig'
import Tabs from './_Tabs'

const maskSecret = secret => {
  // Mask everything other than last 4 characters
  return (secret || '').replace(/^.*.{4}$/gi, 'x')
}

const PaymentSettings = () => {
  const { shopConfig } = useShopConfig()

  const Processors = useMemo(() => {
    if (!shopConfig) return []

    const { stripeBackend, upholdApi, upholdClient, upholdSecret, web3Pk } = shopConfig
    const stripeEnabled = !!stripeBackend
    const upholdEnabled = !!upholdApi && !!upholdClient && !!upholdSecret
    const web3Enabled = !!web3Pk

    let walletAddress = ''

    if (web3Enabled) {
      try {
        const wallet = ethers.Wallet(web3Pk)
        walletAddress = wallet.address
      } catch (err) {
        console.error(err)
      }
    }


    return [
      {
        id: 'stripe',
        title: 'Stripe',
        description: stripeEnabled
          ? '' 
          : 'Use Stripe to easily accept Visa, MasterCard, American Express and almost any other kind of credit or debit card in your shop.',
        icon: (
          <svg width="50" height="71" viewBox="0 0 50 71">
            <path
              fill="#FFF"
              fillRule="evenodd"
              d="M19.74 21.144c0-3.043 2.496-4.213 6.631-4.213 5.93 0 13.42 1.794 19.35 4.993V3.59C39.245 1.014 32.847 0 26.37 0 10.533 0 0 8.27 0 22.08c0 21.534 29.648 18.1 29.648 27.386 0 3.588-3.12 4.758-7.49 4.758-6.476 0-14.746-2.652-21.3-6.241v18.57c7.256 3.12 14.59 4.446 21.3 4.446 16.228 0 27.386-8.035 27.386-22.001-.078-23.25-29.805-19.116-29.805-27.854"
            />
          </svg>
        ),
        enabled: stripeEnabled
      },
      {
        id: 'uphold',
        title: 'Uphold',
        description: upholdEnabled 
          ? `API Key: ${maskSecret(upholdApi)}` 
          : 'Use Uphold to easily accept crypto payments in your shop.',
        icon: (
          <svg width="62" height="82" viewBox="0 0 62 82">
            <path
              fill="#FFF"
              fillRule="evenodd"
              d="M37.569 80.46c1.564-.3 2.565-1.23 2.136-2.942-.409-1.635-1.714-1.866-3.121-1.477-3.963 1.093-7.897 1.066-11.856-.03-1.417-.391-2.7-.078-3.082 1.553-.372 1.584.528 2.542 1.994 2.839 2.331.472 5.338.885 7.056.885s4.612-.394 6.873-.828M15.579 9.735c6.097.048 10.784 2.594 15.138 6.018 4.377-3.52 9.084-5.918 15.002-6.052-7.572-6.48-22.356-6.48-30.14.034m11.687 9.087c-1.12-.767-2.03-1.477-3.017-2.055-9.222-5.399-17.286-1.69-19.24 8.827-.992 5.348-.484 10.62.99 15.796 1.831 6.44 4.806 12.29 9.432 17.64-2.582-15.466 2.112-28.435 11.835-40.208m6.87.03c9.69 11.616 14.3 24.579 11.835 40.228 5.698-6.929 9.106-14.2 10.432-22.426.899-5.576.789-11.075-1.81-16.258-2.176-4.339-5.847-6.462-10.486-6.057-3.811.333-6.958 2.168-9.97 4.514m-3.594 3.002c-.38.563-.61.973-.906 1.327-5.862 6.997-9.35 15.04-10.264 24.104-.556 5.516-.214 10.99 2.97 15.834 4.208 6.403 12.568 6.376 16.722-.05.786-1.216 1.427-2.57 1.89-3.945 1.695-5.034 1.571-10.185.578-15.316-1.585-8.186-5.052-15.457-10.99-21.954m30.952 9.756c-.899 13.97-6.196 26.187-17.374 35.42-8.573 7.082-17.452 7.296-26.222.468C7.379 59.31 1.797 48.18.269 35.048-1.095 23.327 2.7 13.445 12.223 6.376c10.05-7.458 21.187-8.336 32.34-2.83 11.281 5.57 16.508 15.271 16.932 28.065"
            />
          </svg>
        ),
        enabled: upholdEnabled
      },
      {
        id: 'web3',
        title: 'Web3 Wallet',
        description: web3Enabled ? `Address: ${walletAddress}` : 'You have not connected a wallet',
        icon: (
          <svg width="56" height="51" viewBox="0 0 56 51">
            <path
              fill="#FFF"
              fillRule="evenodd"
              d="M49.913 31.408c0 1.357-1.1 2.458-2.459 2.458-1.357 0-2.458-1.1-2.458-2.458s1.1-2.458 2.458-2.458 2.459 1.1 2.459 2.458zM48.027 5.37v3.442H7.293c-.95 0-1.721-.77-1.721-1.721 0-.95.77-1.72 1.72-1.72h40.735zm-.573 30.83c-2.646 0-4.792-2.146-4.792-4.792 0-2.647 2.146-4.792 4.792-4.792h8.026l-.004-.363V15.39c0-2.646-2.146-4.792-4.792-4.792H6.894c-1.937 0-3.507-1.57-3.507-3.507s1.57-3.507 3.507-3.507h40.831c1.358 0 2.459 1.1 2.459 2.458V8.75h3.29l-.065-3.958C53.41 2.145 51.264 0 48.617 0H8.573C3.838 0 0 3.838 0 8.573v33.198c0 4.735 3.838 8.573 8.573 8.573h42.11c2.647 0 4.793-2.145 4.793-4.792v-8.9l-.002-.452h-8.02z"
            />
          </svg>
        ),
        enabled: web3Enabled
      }
    ]
  }, [shopConfig])

  return (
    <>
      <h3 className="admin-title">Settings</h3>
      <Tabs />
      <div className="admin-payment-settings">
        {Processors.map((processor) => (
          <div key={processor.id} className={`processor ${processor.id}`}>
            <div className="icon">{processor.icon}</div>
            <div>
              <div className="title">{processor.title}</div>
              <div className="description">{processor.description}</div>
              <div className="actions">
                <button className="btn btn-outline-primary px-4">
                  {process.enabled ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default PaymentSettings

require('react-styl')(`
  .admin-payment-settings
    .processor
      margin-top: 2rem
      display: flex
      .icon
        display: flex
        align-items: center
        justify-content: center
        width: 115px
        height: 115px
        border-radius: 10px
        background: red
        margin-right: 1.5rem
      &.stripe .icon
        background-color: #6772e5
      &.uphold .icon
        background-color: #00cc58
      &.web3 .icon
        background-color: #3b80ee
      > div:nth-child(2)
        display: flex
        flex-direction: column
        justify-content: space-between
        line-height: normal
        .title
          font-weight: bold
        .description
          max-width: 30rem
        .actions
          margin-top: 0.25rem
`)
