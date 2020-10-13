import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Switch, Route } from 'react-router-dom'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

import { useEagerConnect } from './utils'

import './app.css'

import DshopProvider from 'components/DshopProvider'
import PreviewBanner from 'components/PreviewBanner'

import Confirmation from '../shared/Confirmation'
import Storefront from './pages/Storefront'

const Web3ReactNetworkProvider = createWeb3ReactRoot('network')

function getLibrary(provider) {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

const Activate = ({ children }) => {
  useEagerConnect()
  return children
}

const Providers = () => {
  return (
    <HashRouter>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3ReactNetworkProvider getLibrary={getLibrary}>
          <Activate>
            <DshopProvider>
              <PreviewBanner
                wrapperClassName="text-sm py-2 bg-white text-black"
                className="container flex justify-between"
              />
              <Switch>
                <Route path="/order" component={Confirmation} />
                <Route component={Storefront} />
              </Switch>
            </DshopProvider>
          </Activate>
        </Web3ReactNetworkProvider>
      </Web3ReactProvider>
    </HashRouter>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))
