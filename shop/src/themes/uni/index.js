import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Switch, Route } from 'react-router-dom'
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

import './app.css'

import DshopProvider from 'components/DshopProvider'
import PreviewBanner from 'components/PreviewBanner'

import Confirmation from '../shared/Confirmation'
import Checkout from '../shared/checkout/Loader'
import Storefront from './components/Storefront'

function getLibrary(provider) {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

const Providers = () => {
  return (
    <HashRouter>
      <Web3ReactProvider getLibrary={getLibrary}>
        <DshopProvider>
          <PreviewBanner
            wrapperClassName="text-sm py-2 bg-white text-black"
            className="container flex justify-between"
          />
          <Switch>
            <Route path="/checkout" component={Checkout} />
            <Route path="/order" component={Confirmation} />
            <Route component={Storefront} />
          </Switch>
        </DshopProvider>
      </Web3ReactProvider>
    </HashRouter>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))
