import React, { useState, useEffect } from 'react'
import { HashRouter, Switch, Route } from 'react-router-dom'
import DisplayPolicy from 'components/DisplayShopPolicy'
import useConfig from 'utils/useConfig'

import Header from './_Header'
import Footer from './_Footer'

/*
 * @function getPolicies
 * @param authToken<string> The shop's backend authToken
 * @returns Promise<<object> : { policyHeads: <Array<string>>, policies: <Array<Array<String, String, boolean>>>}>
 */
const getPolicies = (authToken) => {
  let policyHeads = ['']
  let policies = [['', '', false]]

  return fetch(`/shop/policies`, {
    method: 'GET',
    headers: {
      authorization: `bearer ${encodeURIComponent(authToken)}`
    }
  })
    .then((res) => {
      if (!res.ok) {
        return null
      } else {
        return res.json() //Expected type: <Array<Array<String, String, boolean>>>
      }
    })
    .then((result) => {
      if (result) {
        policyHeads = result.map((policy) => policy[0])
        policies = result
      }
      return { policyHeads: policyHeads, policies: policies }
    })
    .catch((err) => {
      console.error('Failed to load shop policies', err)
    })
}

/*
 * @component PolicyPage
 * Renders a shop's policy pages
 */

const PolicyPage = () => {
  const { config } = useConfig()
  const [policyHeadings, setHeadings] = useState([''])
  const [policies, setPolicies] = useState([['', '', false]])

  useEffect(() => {
    const updatePolicies = async () => {
      getPolicies(config.backendAuthToken).then(({ policyHeads, policies }) => {
        setHeadings(policyHeads)
        setPolicies(policies)
      })
    }

    updatePolicies()
  }, [])

  return (
    <>
      <Header />
      <HashRouter>
        <Switch>
          {policies.map((policy, index) => {
            return (
              <Route key={`${index}`} path={`/policy${index + 1}`}>
                <div className="container prose">
                  <DisplayPolicy heading={policy[0]} text={policy[1]} />
                </div>
              </Route>
            )
          })}
        </Switch>
      </HashRouter>
      <Footer policyHeadings={policyHeadings} />
    </>
  )
}

export { getPolicies, PolicyPage }
