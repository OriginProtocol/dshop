import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Switch, Route } from 'react-router-dom'

import './app.css'

import DshopProvider from 'components/DshopProvider'
import PreviewBanner from 'components/PreviewBanner'

// import Confirmation from './components/Confirmation'
import Checkout from './components/checkout/Loader'
import Storefront from './components/Storefront'

const Providers = () => {
  return (
    <HashRouter>
      <DshopProvider>
        <PreviewBanner
          wrapperClassName="bg-black text-white text-sm py-2"
          className="container flex justify-between"
        />
        <Switch>
          <Route path="/checkout" component={Checkout} />
          {/* <Route path="/order" component={Confirmation} /> */}
          <Route component={Storefront} />
        </Switch>
      </DshopProvider>
    </HashRouter>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))
