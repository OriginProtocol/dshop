import React, { useState, useEffect } from 'react'

import { useStateValue } from 'data/state'

import SignUp from './SignUp'
import ServerSetup from './ServerSetup'
import Redirect from 'components/Redirect'
import SetupLayout from './_SetupLayout'

const FirstTime = () => {
  const [{ admin }] = useStateValue()
  const [step, setStep] = useState()

  useEffect(() => {
    if (admin.reason === 'no-active-network') {
      setStep('server-setup')
    } else if (admin.reason === 'no-shops' || admin.reason === 'no-shop') {
      setStep('create-shop')
    } else if (admin.reason === 'no-users') {
      setStep('sign-up')
    } else if (admin.reason) {
      setStep('login')
    }
  }, [admin.reason])

  if (!step || !admin) {
    return null
  }

  return (
    <SetupLayout>
      <div className="admin-first-time">
        {step === 'sign-up' ? (
          <SignUp />
        ) : step === 'server-setup' ? (
          <ServerSetup />
        ) : (
          <Redirect to="/admin" />
        )}
      </div>
    </SetupLayout>
  )
}

export default FirstTime

require('react-styl')(`

  .admin-first-time
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    margin-top: 4rem
    margin-bottom: 4rem

    .desc
      font-size: 1.125rem
      text-align: center
      color: #ffffff
      margin-bottom: 1.5rem

    a
      color: #3b80ee
    svg
      width: 180px
      fill: #333
      margin-bottom: 2rem
    .sign-up
      display: flex
      flex-direction: column

    .create-shop
      .advanced-link
        color: #fff

      .form-group
        color: #fff

`)

require('react-styl')(`
`)
