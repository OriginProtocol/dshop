import React, { useReducer, useEffect } from 'react'
import fbt from 'fbt'
import useSentry from 'utils/useSentry'

import Modal from './Modal'

const reducer = (state, newState) => ({ ...state, ...newState })

const ReportErrorModal = ({ onClose, errorEvent }) => {
  const { sentry } = useSentry()

  const [state, setState] = useReducer(reducer, {
    showModal: false,
    shouldClose: false,
    reportSent: false
  })

  const onConfirm = async () => {
    sentry.captureEvent({
      ...errorEvent,
      skipProcessing: true
    })
    setState({
      reportSent: true
    })
  }

  useEffect(() => {
    if (state.reportSent) {
      const timeout = setTimeout(() => {
        setState({ shouldClose: true })
      }, 2000)

      return () => clearTimeout(timeout)
    }
  }, [state.reportSent])

  return (
    <Modal
      shouldClose={state.shouldClose}
      onClose={() => {
        setState({ showModal: false, shouldClose: false })
        onClose()
      }}
    >
      <div className="modal-body report-error-modal">
        {state.reportSent ? (
          <>
            <h5>
              <fbt desc="component.ReportErrorModal.thankYou">Thank you.</fbt>
            </h5>
            <div>
              <fbt desc="component.ReportErrorModal.reportSubmitted">
                Your report has been submitted.
              </fbt>
            </div>
          </>
        ) : (
          <>
            <h5>
              <fbt desc="component.ReportErrorModal.crashIssue">
                It looks like we&apos;re having issues.
              </fbt>
            </h5>

            <div>
              <fbt desc="component.ReportErrorModal.sendReport">
                Would you like to send a report of the error so that we can fix
                it?
              </fbt>
            </div>

            <div className="actions">
              <button
                className="btn btn-outline-primary mr-2"
                type="button"
                onClick={() => {
                  setState({ shouldClose: true })
                }}
              >
                <fbt desc="Skip">Skip</fbt>
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={onConfirm}
                disabled={state.saving}
              >
                <fbt desc="Yes">Yes</fbt>
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default ReportErrorModal

require('react-styl')(`
  .report-error-modal
    text-align: center
    h5
      margin-top: 1rem
    .actions
      border-top: 1px solid #cdd7e0
      padding-top: 1.25rem
      margin-top: 1.5rem
      display: flex
      justify-content: center

      .btn
        width: 135px
`)
