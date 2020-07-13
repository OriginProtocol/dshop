import React, { useState } from 'react'

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
          message: 'Your credentials work great.',
          style: 'success'
        })
      } else {
        dispatch({
          type: 'toast',
          message: `Your credentials don't seem to work. Check and try again`,
          style: 'error'
        })
      }
    } catch (err) {
      console.error(err)
      dispatch({
        type: 'toast',
        message: `Something went wrong when trying to verify your credentials`,
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
      {verifying ? 'Verifying...' : (children || 'Verify')}
    </button>
  )
}

export default VerifyButton

require('react-styl')(`
`)
