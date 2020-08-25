import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import dayjs from 'dayjs'

import Modal from 'components/Modal'
import useConfig from 'utils/useConfig'

const NoWeb3 = ({ setShouldClose }) => (
  <div className="affiliate-modal">
    <h3>Oops</h3>
    <div className="description">
      It appears you do not have a{' '}
      <a
        href="https://ethereum.org/wallets/"
        target="_blank"
        rel="noopener noreferrer"
      >
        web3 enabled browser
      </a>
      .
    </div>
    <button
      onClick={() => setShouldClose(true)}
      className="btn btn-primary"
      children="OK"
    />
  </div>
)

const ConnectWallet = ({ setState }) => (
  <div className="affiliate-modal connect">
    <h3>Connect your crypto wallet</h3>
    <div className="description">
      Please click “Connect” and open your crypto wallet manually if it does not
      do so automatically
    </div>
    <button
      onClick={() => {
        window.ethereum.enable().then(([account]) => {
          setState({ account })
        })
      }}
      className="btn btn-primary btn-lg"
    >
      Connect
    </button>
  </div>
)

const Join = ({
  setState,
  dispatch,
  state,
  config,
  account,
  setError,
  error
}) => (
  <div className="affiliate-modal sign-request">
    <h3>Please provide your contact information</h3>

    {!error ? null : (
      <div className="invalid-feedback" style={{ display: 'block' }}>
        {error}
      </div>
    )}

    <div className="form-group">
      <input
        type="text"
        placeholder="John"
        value={state.firstName || ''}
        className="form-control"
        onChange={(e) => setState({ ...state, firstName: e.target.value })}
      />
    </div>
    <div className="form-group">
      <input
        type="text"
        placeholder="Deer"
        value={state.lastName || ''}
        className="form-control"
        onChange={(e) => setState({ ...state, lastName: e.target.value })}
      />
    </div>
    <div className="form-group">
      <input
        autoFocus
        type="email"
        placeholder="me@email.com"
        className="form-control"
        value={state.email || ''}
        onChange={(e) => setState({ ...state, email: e.target.value })}
      />
    </div>

    <div className="description">
      You will be asked to sign a message in order to enable Origin Affiliates.
    </div>
    <button
      onClick={() => {
        const date = dayjs().toISOString()
        const msg = `OGN Affiliate Login ${date}`
        window.ethereum.send(
          {
            jsonrpc: '2.0',
            method: 'personal_sign',
            params: [msg, account],
            id: 1
          },
          async (err, res) => {
            const sig = res.result
            if (sig) {
              // Register the affiliate account with the backend.
              const req = await fetch(`${config.backend}/affiliate/join`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `bearer ${encodeURIComponent(
                    config.backendAuthToken
                  )}`
                },
                body: JSON.stringify({
                  msg,
                  sig,
                  firstName: state.firstName,
                  lastName: state.lastName,
                  email: state.email
                })
              })
              if (!req.ok) {
                console.error('Affiliate account creation failed')
                setError('An error occurred. Please try again.')
                return
              }
              const json = await req.json()
              if (!json.success) {
                const reason = json.reason || 'reason unknown'
                console.error('Affiliate account creation failed:', reason)
                setError(reason)
                return
              }
              // Account was created, go to the affiliate dashboard page.
              setError(null)
              dispatch({
                type: 'setAffiliate',
                affiliate: {
                  account,
                  firstName: state.firstName,
                  lastName: state.lastName,
                  email: state.email,
                  sig,
                  msg,
                  toolbar: true
                }
              })
              setState({ mode: 'affiliate' })
            }
          }
        )
      }}
      className="btn btn-primary btn-lg"
    >
      Sign and Enable
    </button>
  </div>
)

const JoinModal = ({ setState, dispatch, state }) => {
  const hasEthereum = get(window, 'ethereum.enable') ? true : false
  const selectedAccount = get(window, 'ethereum.selectedAddress')
  const [account, setAccount] = useState(selectedAccount)
  const [shouldClose, setShouldClose] = useState()
  const [error, setError] = useState('')
  const { config } = useConfig()

  useEffect(() => {
    if (state.account) {
      setAccount(state.account)
    }
  }, [state.account])

  return (
    <Modal shouldClose={shouldClose} onClose={() => setState({ modal: false })}>
      <button className="close" onClick={() => setShouldClose(true)}>
        <span aria-hidden="true">&times;</span>
      </button>
      {!hasEthereum ? (
        <NoWeb3 {...{ setShouldClose }} />
      ) : account ? (
        <Join
          {...{ setState, dispatch, state, config, account, setError, error }}
        />
      ) : (
        <ConnectWallet {...{ setState }} />
      )}
    </Modal>
  )
}

export default JoinModal

require('react-styl')(`
  .modal-content
    button.close
      position: absolute
      top: 0.5rem
      right: 0.75rem
      font-weight: 500

  .affiliate-modal
    display: flex
    flex-direction: column
    align-items: center
    padding: 2.5rem
    text-align: center
    h3
      font-size: 1.5rem
      font-weight: bold
    .description
      color: #666
      font-size: 1.125rem
      font-weight: normal
      margin-bottom: 2rem
      a
        color: #007dff
        text-decoration: underline
    .btn
      padding-left: 3rem
      padding-right: 3rem
    &.connect
      .description
        background-image: url(images/wallet-icon.svg)
        background-repeat: no-repeat
        background-position: center top
        padding-top: 8rem
        margin-top: 1rem
    &.sign-request
      .description
        background-image: url(images/affiliate-sign.svg)
        background-repeat: no-repeat
        background-position: center top
        padding-top: 8rem
        margin-top: 1rem
  @media (max-width: 767.98px)
    .affiliate-modal
      .btn
        padding-left: 2rem
        padding-right: 2rem

`)
