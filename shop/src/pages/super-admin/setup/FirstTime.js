import React, { useState, useEffect } from 'react'

import { useStateValue } from 'data/state'

import { DshopLogo } from 'components/icons/Admin'

import SignUp from './SignUp'
import ServerSetup from './ServerSetup'
import CreateShop from '../shops/new-shop/CreateShop'

const FirstTime = () => {
  const [{ admin }] = useStateValue()
  const [step, setStep] = useState('no-shops')

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
    <div className="container admin-first-time">
      <DshopLogo />
      {step === 'sign-up' ? (
        <SignUp />
      ) : step === 'server-setup' ? (
        <ServerSetup />
      ) : (
        <>
          <div className="mb-4">Create a Shop:</div>
          <CreateShop />
        </>
      )}
    </div>
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
    a
      color: #3b80ee
    svg
      width: 180px
      fill: #333
      margin-bottom: 2rem
    .sign-up
      display: flex
      flex-direction: column
      max-width: 400px
`)
