import React, { useState, useEffect } from 'react'
import _omit from 'lodash/omit'
import useSentry from 'utils/useSentry'
import ReportErrorModal from 'components/ReportErrorModal'

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

const SentryErrorBoundary = ({ children }) => {
  const { enabled: sentryEnabled, sentry } = useSentry()

  const [errorEvent, setErrorEvent] = useState()

  const eventProcessor = (event) => {
    if (event.skipProcessing) return _omit(event, ['skipProcessing'])

    const pathname = new URL(event.request.url)
    const isAdminPage = /^#\/(super-)?admin(\/.*)?$/.test(pathname.hash)
    if (!isAdminPage) {
      // Ask permission from the user, if it is not in admin page
      setErrorEvent(event)
      return null
    }

    // Let the event log otherwise
    return event
  }

  useEffect(() => {
    if (sentryEnabled) {
      sentry.configureScope((scope) => {
        scope.addEventProcessor(eventProcessor)
      })
    }
  }, [sentryEnabled, sentry])

  const onCatch = (error, errorInfo) => {
    if (!sentryEnabled) {
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
          onClose={() => {
            setErrorEvent(null)
          }}
        />
      )}
      <ErrorBoundary onCatch={onCatch}>{children}</ErrorBoundary>
    </>
  )
}

export default SentryErrorBoundary
