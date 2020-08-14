import React, { useState } from 'react'
import fbt from 'fbt'

import { useStateValue } from 'data/state'

const VerifyButton = ({ onVerify, children }) => {
  const [, dispatch] = useStateValue()
  const [verifying, setVerifying] = useState(false)

  const onVerifyClick = async () => {
    try {
      setVerifying(true)

      const { valid } = await onVerify()

      if (valid) {
        dispatch({
          type: 'toast',
          message: fbt(
            `Your credentials work great.`,
            'admin.settings.VerifyButton.success'
          ),
          style: 'success'
        })
      } else {
        dispatch({
          type: 'toast',
          message: fbt(
            `Your credentials don't seem to work. Check and try again`,
            'admin.settings.VerifyButton.invalidError'
          ),
          style: 'error'
        })
      }
    } catch (err) {
      console.error(err)
      dispatch({
        type: 'toast',
        message: fbt(
          `Something went wrong when trying to verify your credentials`,
          'admin.settings.VerifyButton.genericError'
        ),
        style: 'error'
      })
    } finally {
      setVerifying(false)
    }
  }
  return (
    <button
      className="btn btn-outline-primary mr-2"
      type="button"
      onClick={onVerifyClick}
      disabled={verifying}
    >
      {verifying ? (
        <>
          <fbt desc="Verifying">Verifying</fbt>...
        </>
      ) : (
        children || <fbt desc="Verify">Verify</fbt>
      )}
    </button>
  )
}

export default VerifyButton

require('react-styl')(`
`)
