import React, { useState, useEffect } from 'react'

import useConfig from 'utils/useConfig'
import Header from './_Header'
import Footer from './_Footer'
import Cart from '../../shared/Cart'
import { getPolicies } from './Policies'

const CartWrapper = () => {
  const { config } = useConfig()
  const [policyHeadings, setHeadings] = useState([''])
  useEffect(() => {
    const updatePolicies = async () => {
      getPolicies(config.backendAuthToken).then(({ policyHeads, policies }) => {
        setHeadings(policyHeads)
      })
    }

    updatePolicies()
  }, [])
  return (
    <>
      <Header />
      <Cart />
      <Footer policyHeadings={policyHeadings} />
    </>
  )
}

export default CartWrapper
