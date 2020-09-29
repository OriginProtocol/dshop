import React, { useEffect } from 'react'
import pick from 'lodash/pick'

import Modal from 'components/Modal'

import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'
import useWallet from 'utils/useWallet'
import { formInput, formFeedback } from 'utils/formHelpers'
import { isUnstoppableName } from '@origin/utils/dns'
import { getOwner, setIPFSHash } from 'utils/unstoppable'
import { useStateValue } from 'data/state'

const ActivateBuild = ({ className = '', shop, ipfsHash }) => {
  const [{ admin }, dispatch] = useStateValue()
  const { config } = useConfig()
  const [state, setState] = useSetState()
  const {
    enable,
    status,
    signerStatus,
    networkOk,
    signer,
    provider
  } = useWallet()

  useEffect(() => {
    if (!state.loaded && !state.loading) {
      setState({ loading: true })

      fetch(`${config.backend}/shops/${shop.authToken}/get-names`, {
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${encodeURIComponent(shop.authToken)}`
        },
        credentials: 'include',
        method: 'GET'
      }).then((res) => {
        if (res.ok) {
          res.json().then(({ success, reason, names }) => {
            if (success === false) {
              setState({ error: reason })
            } else {
              setState({ loaded: true, loading: false, deployedNames: names })
              dispatch({ type: 'reload', target: 'deployments' })
            }
          })
        }
      })
    }
  }, [state.loaded, state.loading])

  useEffect(() => {
    if (state.doActivate) {
      fetch(`${config.backend}/shops/${shop.authToken}/set-names`, {
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${encodeURIComponent(shop.authToken)}`
        },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
          ipfsHash,
          ...pick(state, 'hostnames', 'dnsProvider')
        })
      }).then((res) => {
        if (res.ok) {
          res.json().then(({ success, reason }) => {
            if (success === false) {
              setState({ error: reason, doActivate: false, hostnames: [] })
            } else {
              setState({
                shouldClose: true,
                doActivate: false,
                hostname: null,
                newhostname: null
              })
              dispatch({ type: 'reload', target: 'deployments' })
            }
          })
        } else {
          console.error(
            `Error setting hostname: ${res.status}: ${res.statusText}`
          )
          setState({ error: 'Unknown error', doActivate: false, hostnames: [] })
        }
      })
    }
  }, [state.doActivate])

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)
  const network = admin.networks.find((n) => n.active)
  const isDisabled = status === 'disabled' || signerStatus === 'disabled'

  const submit = async (ev) => {
    ev.preventDefault()

    if (
      (!state.hostname || ['-', 'new'].includes(state.hostname)) &&
      !state.newhostname
    ) {
      setState({
        feedback: `Hostname must be set`,
        feedbackClass: 'alert alert-danger'
      })
      return
    }

    if (isDisabled) {
      await enable()
    }

    const name = !['-', 'new'].includes(state.hostname)
      ? state.hostname
      : state.newhostname

    if (isUnstoppableName(name)) {
      if (!networkOk) {
        setState({
          feedback: `Wrong network`,
          feedbackClass: 'alert alert-danger'
        })
      } else {
        try {
          const owner = await getOwner(provider, name)
          const activeSigner = await signer.getAddress()

          if (owner !== activeSigner) {
            setState({
              feedback: `Active signer account not owner of ${name}`,
              feedbackClass: 'alert alert-danger'
            })
          } else if (signerStatus !== 'enabled' || signer.address === null) {
            setState({
              feedback: `Signer not usable, no account found?`,
              feedbackClass: 'alert alert-danger'
            })
          } else {
            const tx = await setIPFSHash(signer, name, ipfsHash)
            const receipt = await tx.wait()

            if (receipt && receipt.blockNumber) {
              const txHash = receipt.transactionHash

              console.log(`Transaction ${txHash} sent`)

              setState({ doActivate: true, hostnames: [name] })
            } else {
              setState({
                feedback: `Sending of transaction failed`,
                feedbackClass: 'alert alert-danger'
              })
            }
          }
        } catch (err) {
          console.error(err)
          setState({
            feedback: err.message ? err.message : err.toString(),
            feedbackClass: 'alert alert-danger'
          })
        }
      }
    } else {
      setState({ doActivate: true, hostnames: [name] })
    }
  }

  const isUnstoppable = isUnstoppableName(
    state.hostname == 'new' ? state.newhostname : state.hostname
  )

  const defaultDNSProvider = isUnstoppable
    ? 'unstoppable'
    : network.cloudflareEmail && !network.gcpCredentials
    ? 'cloudflare'
    : network.gcpCredentials && !network.cloudflareEmail
    ? 'gcp'
    : ''

  return (
    <>
      <button
        type="button"
        className={`btn btn-outline-primary ${className}`}
        onClick={() => setState({ openModal: true })}
      >
        Activate
      </button>
      {!state.openModal ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => setState({}, true)}
        >
          <div className="modal-body p-5">
            <Feedback />
            <form className="sign-up" onSubmit={submit}>
              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>Hostname</label>
                  <select {...input('hostname')}>
                    <option key="none" value="-">
                      -
                    </option>
                    {state.deployedNames.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                    <option key="new" value="new">
                      New
                    </option>
                  </select>
                </div>
              </div>

              {state.hostname !== 'new' ? null : (
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>New Hostname</label>
                    <input
                      {...input('newhostname')}
                      placeholder="eg mydshop.com"
                    />
                  </div>
                </div>
              )}

              {!state.hostname ||
              (['new', '-'].includes(state.hostname) &&
                typeof state.newhostname === 'undefined') ? null : (
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>DNS Provider</label>

                    <select
                      value={
                        state.dnsProvider
                          ? state.dnsProvider
                          : defaultDNSProvider
                      }
                      onChange={(e) =>
                        setState({ dnsProvider: e.target.value })
                      }
                      disabled={isUnstoppable}
                    >
                      <option value="">None</option>
                      {network.cloudflareEmail ? (
                        <option value="cloudflare">Cloudflare</option>
                      ) : null}
                      {network.gcpCredentials ? (
                        <option value="gcp">GCP DNS</option>
                      ) : null}
                      {!isUnstoppable ? null : (
                        <option value="unstoppable">Unstoppable Domains</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {!state.feedback ? null : (
                <div className="form-row">
                  <div
                    className={
                      state.feedbackClass ? state.feedbackClass : 'feedback'
                    }
                  >
                    {state.feedback}
                  </div>
                </div>
              )}

              <div className="d-flex mt-2 align-items-center">
                <button
                  type="submit"
                  className="btn btn-primary align-self-center px-5"
                  children="Save"
                />
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  )
}

export default ActivateBuild
