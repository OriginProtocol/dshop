require('dotenv').config()

import React from 'react'
import ReactDOM from 'react-dom'

import { HashRouter, BrowserRouter } from 'react-router-dom'
import Styl from 'react-styl'

import * as Sentry from '@sentry/react'

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

const sentryOptions = {
  dsn: process.env.SENTRY_DSN
}

Sentry.init(sentryOptions)

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidCatch(error, errorInfo) {
    const eventId = Sentry.captureException(error, { errorInfo })

    if (typeof Sentry.showReportDialog === 'function') {
      Sentry.showReportDialog({ eventId })
    }
  }

  render() {
    return this.props.children
  }
}

const Providers = () => {
  return (
    <ErrorBoundary>
      <Router>
        <StateProvider>
          <App />
        </StateProvider>
      </Router>
    </ErrorBoundary>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))

Styl.addStylesheet()
