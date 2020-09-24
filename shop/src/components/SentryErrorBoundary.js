import React, { useState, useEffect } from 'react'
import _omit from 'lodash/omit'
import _get from 'lodash/get'
import useSentry from 'utils/useSentry'
import ReportErrorModal from 'components/ReportErrorModal'
import useConfig from '../utils/useConfig'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidCatch(error, errorInfo) {
    if (typeof this.props.onCatch === 'function') {
      this.props.onCatch(error, errorInfo)
    }
  }

  render() {
    return this.props.children
  }
}

const isAdminPage = (locationHash) =>
  /^#\/(super-)?admin(\/.*)?$/.test(locationHash)

const SentryErrorBoundary = ({ children }) => {
  const { enabled: sentryEnabled, sentry } = useSentry()
  const { config } = useConfig()

  const [errorEvent, setErrorEvent] = useState()
  const [sentryInitialized, setSentryInitialized] = useState(false)

  const shouldLogUserErrors = _get(config, 'logErrors', true)

  const eventProcessor = (event) => {
    if (!event.skipProcessing) {
      const pathname = new URL(event.request.url)
      const adminPage = isAdminPage(pathname.hash)

      if (!adminPage) {
        if (!window.shouldLogUserErrors) {
          console.error('Exception occurred', event)
          return null
        }

        // Ask permission from the user, if it is not in admin page
        setErrorEvent(event)
        return null
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      // Let's not pollute things from dev environment on Sentry
      console.error('Would have logged the following event to sentry:', event)
      return null
    }

    // Let the event log otherwise
    return _omit(event, ['skipProcessing'])
  }

  useEffect(() => {
    if (sentryEnabled && sentry && !sentryInitialized) {
      sentry.configureScope((scope) => {
        scope.addEventProcessor(eventProcessor)
      })

      setSentryInitialized(true)
    }
  }, [sentryEnabled, sentry, sentryInitialized])

  useEffect(() => {
    window.shouldLogUserErrors = shouldLogUserErrors
  }, [shouldLogUserErrors])

  const onCatch = (error, errorInfo) => {
    if (
      !sentryEnabled ||
      !sentry ||
      typeof sentry.captureException !== 'function'
    ) {
      console.error('Exception occured', error)
      return
    }

    sentry.captureException(error, { errorInfo })
  }

  return (
    <>
      {!errorEvent ? null : (
        <ReportErrorModal
          errorEvent={errorEvent}
          onClose={() => setErrorEvent(null)}
        />
      )}
      <ErrorBoundary onCatch={onCatch}>{children}</ErrorBoundary>
    </>
  )
}

export default SentryErrorBoundary
