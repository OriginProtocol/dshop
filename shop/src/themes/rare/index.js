import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter } from 'react-router-dom'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

import './app.css'

import DshopProvider from 'components/DshopProvider'
import PreviewBanner from 'components/PreviewBanner'

import Storefront from './pages/Storefront'

const Web3ReactNetworkProvider = createWeb3ReactRoot('network')

function getLibrary(provider) {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

const Providers = () => {
  return (
    <HashRouter>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3ReactNetworkProvider getLibrary={getLibrary}>
          <DshopProvider>
            <PreviewBanner
              wrapperClassName="text-sm py-2 bg-white text-black"
              className="container flex justify-between"
            />
            <Storefront />
          </DshopProvider>
        </Web3ReactNetworkProvider>
      </Web3ReactProvider>
    </HashRouter>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))
