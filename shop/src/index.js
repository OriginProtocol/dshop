// eslint-disable-next-line
__webpack_public_path__ = window.webpackPublicPath || ''
require('dotenv').config()

import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

import { HashRouter, BrowserRouter } from 'react-router-dom'
import Styl from 'react-styl'
import setLocale from 'utils/setLocale'

import SentryErrorBoundary from 'components/SentryErrorBoundary'

import { StateProvider } from 'data/state'

import App from './pages/App'
import './css/app.scss'
import './css/app.css'

const Router = process.env.ABSOLUTE ? BrowserRouter : HashRouter

if (process.env.NODE_ENV === 'production') {
  try {
    require('../public/app.css')
  } catch (e) {
    console.warn('No built CSS found')
  }
}

const Providers = () => {
  useEffect(() => {
    setLocale()
  }, [])

  return (
    <StateProvider>
      <SentryErrorBoundary>
        <Router>
          <App />
        </Router>
      </SentryErrorBoundary>
    </StateProvider>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))

Styl.addStylesheet()
