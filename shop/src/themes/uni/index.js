import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Switch, Route } from 'react-router-dom'

import './app.css'

import DshopProvider from 'components/DshopProvider'
import PreviewBanner from 'components/PreviewBanner'

import Confirmation from '../shared/Confirmation'
import Checkout from '../shared/checkout/Loader'
import Storefront from './components/Storefront'

const Providers = () => {
  return (
    <HashRouter>
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
    </HashRouter>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))
